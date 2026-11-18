
"use server";

import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNull,
  ne,
  or,
} from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/db";

import { user } from "@/db/schema/auth-schema";
import { challenges } from "@/db/schema/challenge-schema";
import { challengeMembers } from "@/db/schema/membership-schema";
import { challengeInvitations } from "@/db/schema/invitation-schema";

// --------------------------------------------------
// AUTHENTICATION
// --------------------------------------------------

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

// --------------------------------------------------
// 1. DISCOVER REGISTERED USERS
// --------------------------------------------------

export async function getUsersAction(search = "") {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      success: false as const,
      error: "Unauthorized.",
    };
  }

  const query = search.trim().slice(0, 80);

  try {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        country: user.country,
      })
      .from(user)
      .where(
        and(
          ne(user.id, currentUser.id),
          or(isNull(user.banned), eq(user.banned, false)),
          query
            ? or(
                ilike(user.name, `%${query}%`),
                ilike(user.username, `%${query}%`)
              )
            : undefined
        )
      )
      .orderBy(user.name)
      .limit(100);

    return {
      success: true as const,
      users,
    };
  } catch (error) {
    console.error("Get users error:", error);

    return {
      success: false as const,
      error: "Unable to load users.",
    };
  }
}

// --------------------------------------------------
// 2. GET PUBLIC USER PROFILE
// --------------------------------------------------

export async function getPublicUserProfileAction(userId: string) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      success: false as const,
      error: "Unauthorized.",
    };
  }

  if (!userId || userId.length > 128) {
    return {
      success: false as const,
      error: "Invalid user.",
    };
  }

  try {
    const [profile] = await db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        country: user.country,
      })
      .from(user)
      .where(
        and(
          eq(user.id, userId),
          or(isNull(user.banned), eq(user.banned, false))
        )
      )
      .limit(1);

    if (!profile) {
      return {
        success: false as const,
        error: "User not found.",
      };
    }

    return {
      success: true as const,
      profile,
    };
  } catch (error) {
    console.error("Get user profile error:", error);

    return {
      success: false as const,
      error: "Unable to load user profile.",
    };
  }
}

// --------------------------------------------------
// 3. GET CHALLENGES THE CURRENT USER CAN INVITE TO
// --------------------------------------------------

export async function getInviteableChallengesAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      success: false as const,
      error: "Unauthorized.",
    };
  }

  try {
    const results = await db
      .select({
        id: challenges.id,
        title: challenges.title,
      })
      .from(challenges)
      .where(
        and(
          eq(challenges.creatorId, currentUser.id),
          eq(challenges.status, "active")
        )
      )
      .orderBy(desc(challenges.createdAt));

    return {
      success: true as const,
      challenges: results,
    };
  } catch (error) {
    console.error("Get inviteable challenges error:", error);

    return {
      success: false as const,
      error: "Unable to load your challenges.",
    };
  }
}

// --------------------------------------------------
// 4. SEND CHALLENGE INVITATION
// --------------------------------------------------

const sendInvitationSchema = z.object({
  challengeId: z.string().uuid(),
  inviteeId: z.string().min(1).max(128),
});

export async function sendChallengeInvitationAction(input: unknown) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      success: false as const,
      error: "Unauthorized.",
    };
  }

  const validation = sendInvitationSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false as const,
      error: "Invalid invitation information.",
    };
  }

  const { challengeId, inviteeId } = validation.data;

  if (inviteeId === currentUser.id) {
    return {
      success: false as const,
      error: "You cannot invite yourself.",
    };
  }

  try {
    await db.transaction(async (tx) => {
      const [challenge] = await tx
        .select({
          id: challenges.id,
          creatorId: challenges.creatorId,
          status: challenges.status,
        })
        .from(challenges)
        .where(eq(challenges.id, challengeId))
        .limit(1);

      if (!challenge) {
        throw new Error("Challenge not found.");
      }

      if (challenge.creatorId !== currentUser.id) {
        throw new Error(
          "Only the challenge creator can invite users."
        );
      }

      if (challenge.status !== "active") {
        throw new Error("This challenge is not active.");
      }

      const [invitee] = await tx
        .select({
          id: user.id,
        })
        .from(user)
        .where(
          and(
            eq(user.id, inviteeId),
            or(isNull(user.banned), eq(user.banned, false))
          )
        )
        .limit(1);

      if (!invitee) {
        throw new Error("User not found or unavailable.");
      }

      const [membership] = await tx
        .select({
          id: challengeMembers.id,
        })
        .from(challengeMembers)
        .where(
          and(
            eq(challengeMembers.challengeId, challengeId),
            eq(challengeMembers.userId, inviteeId),
            isNull(challengeMembers.leftAt)
          )
        )
        .limit(1);

      if (membership) {
        throw new Error(
          "This user has already joined the challenge."
        );
      }

      const [existingInvitation] = await tx
        .select({
          id: challengeInvitations.id,
        })
        .from(challengeInvitations)
        .where(
          and(
            eq(challengeInvitations.challengeId, challengeId),
            eq(challengeInvitations.inviteeId, inviteeId),
            eq(challengeInvitations.status, "pending")
          )
        )
        .limit(1);

      if (existingInvitation) {
        throw new Error("An invitation is already pending.");
      }

      await tx.insert(challengeInvitations).values({
        challengeId,
        inviterId: currentUser.id,
        inviteeId,
      });
    });

    revalidatePath("/invitations");
    revalidatePath("/users");
    revalidatePath(`/users/${inviteeId}`);

    return {
      success: true as const,
      message: "Invitation sent successfully.",
    };
  } catch (error) {
    console.error("Send invitation error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to send invitation.",
    };
  }
}

// --------------------------------------------------
// 5. GET RECEIVED INVITATIONS
// --------------------------------------------------

export async function getMyInvitationsAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      success: false as const,
      error: "Unauthorized.",
    };
  }

  try {
    const invitations = await db
      .select({
        id: challengeInvitations.id,
        status: challengeInvitations.status,
        createdAt: challengeInvitations.createdAt,

        challengeId: challenges.id,
        challengeTitle: challenges.title,
        challengeDescription: challenges.description,

        inviterId: user.id,
        inviterName: user.name,
        inviterUsername: user.username,
        inviterImage: user.image,
      })
      .from(challengeInvitations)
      .innerJoin(
        challenges,
        eq(challengeInvitations.challengeId, challenges.id)
      )
      .innerJoin(
        user,
        eq(challengeInvitations.inviterId, user.id)
      )
      .where(
        and(
          eq(challengeInvitations.inviteeId, currentUser.id),
          eq(challengeInvitations.status, "pending")
        )
      )
      .orderBy(desc(challengeInvitations.createdAt));

    return {
      success: true as const,
      invitations,
    };
  } catch (error) {
    console.error("Get invitations error:", error);

    return {
      success: false as const,
      error: "Unable to load invitations.",
    };
  }
}

// --------------------------------------------------
// 6. ACCEPT OR DECLINE INVITATION
// --------------------------------------------------

const respondSchema = z.object({
  invitationId: z.string().uuid(),
  decision: z.enum(["accepted", "declined"]),
});

export async function respondToChallengeInvitationAction(
  input: unknown
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      success: false as const,
      error: "Unauthorized.",
    };
  }

  const validation = respondSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false as const,
      error: "Invalid invitation response.",
    };
  }

  const { invitationId, decision } = validation.data;

  try {
    const challengeId = await db.transaction(async (tx) => {
      const [invitation] = await tx
        .select()
        .from(challengeInvitations)
        .where(
          and(
            eq(challengeInvitations.id, invitationId),
            eq(challengeInvitations.inviteeId, currentUser.id),
            eq(challengeInvitations.status, "pending")
          )
        )
        .limit(1);

      if (!invitation) {
        throw new Error(
          "Invitation not found or already processed."
        );
      }

      const [challenge] = await tx
        .select()
        .from(challenges)
        .where(eq(challenges.id, invitation.challengeId))
        .limit(1);

      if (!challenge) {
        throw new Error("Challenge no longer exists.");
      }

      if (decision === "accepted") {
        if (challenge.status !== "active") {
          throw new Error("This challenge is no longer active.");
        }

        // Check whether the user is already an active member.
        const [activeMembership] = await tx
          .select({
            id: challengeMembers.id,
          })
          .from(challengeMembers)
          .where(
            and(
              eq(challengeMembers.challengeId, invitation.challengeId),
              eq(challengeMembers.userId, currentUser.id),
              isNull(challengeMembers.leftAt)
            )
          )
          .limit(1);

        // Enforce the participant limit for new active memberships.
        if (
          !activeMembership &&
          challenge.maxParticipants !== null
        ) {
          const [participantCount] = await tx
            .select({
              total: count(),
            })
            .from(challengeMembers)
            .where(
              and(
                eq(challengeMembers.challengeId, invitation.challengeId),
                isNull(challengeMembers.leftAt)
              )
            );

          if (
            Number(participantCount.total) >=
            challenge.maxParticipants
          ) {
            throw new Error(
              "This challenge has reached its participant limit."
            );
          }
        }
      }

      // Only process the invitation if it is still pending
      // and belongs to the authenticated user.
      const [updated] = await tx
        .update(challengeInvitations)
        .set({
          status: decision,
          respondedAt: new Date(),
        })
        .where(
          and(
            eq(challengeInvitations.id, invitationId),
            eq(challengeInvitations.inviteeId, currentUser.id),
            eq(challengeInvitations.status, "pending")
          )
        )
        .returning({
          id: challengeInvitations.id,
        });

      if (!updated) {
        throw new Error("Invitation has already been processed.");
      }

      if (decision === "accepted") {
        // Find any previous membership, including one where
        // the user previously left the challenge.
        const [existingMembership] = await tx
          .select()
          .from(challengeMembers)
          .where(
            and(
              eq(challengeMembers.challengeId, invitation.challengeId),
              eq(challengeMembers.userId, currentUser.id)
            )
          )
          .limit(1);

        if (existingMembership) {
          if (existingMembership.leftAt !== null) {
            await tx
              .update(challengeMembers)
              .set({
                leftAt: null,
              })
              .where(
                eq(challengeMembers.id, existingMembership.id)
              );
          }
        } else {
          await tx.insert(challengeMembers).values({
            challengeId: invitation.challengeId,
            userId: currentUser.id,
          });
        }
      }

      return invitation.challengeId;
    });

    revalidatePath("/invitations");
    revalidatePath("/challenges");
    revalidatePath(`/challenges/${challengeId}`);
    revalidatePath("/dashboard");

    return {
      success: true as const,
      message:
        decision === "accepted"
          ? "You joined the challenge successfully."
          : "Invitation declined.",
    };
  } catch (error) {
    console.error("Respond to invitation error:", error);

    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Unable to process invitation.",
    };
  }
}

// --------------------------------------------------
// 7. PENDING INVITATION COUNT
// --------------------------------------------------

export async function getPendingInvitationCountAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      success: false as const,
      count: 0,
    };
  }

  try {
    const [result] = await db
      .select({
        total: count(),
      })
      .from(challengeInvitations)
      .where(
        and(
          eq(challengeInvitations.inviteeId, currentUser.id),
          eq(challengeInvitations.status, "pending")
        )
      );

    return {
      success: true as const,
      count: Number(result.total),
    };
  } catch (error) {
    console.error("Invitation count error:", error);

    return {
      success: false as const,
      count: 0,
    };
  }
}
