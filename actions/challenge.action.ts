"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { and, count, desc, eq, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { challenges } from "@/db/schema/challenge-schema";
import { challengeMembers } from "@/db/schema/membership-schema";
import { challengeTasks } from "@/db/schema/task-schema";
import { challengeSchedules } from "@/db/schema/schedule-schema";

const initialTaskSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  frequency: z.enum(["daily", "selected_days"]),
  weekdays: z.array(z.number().int().min(0).max(6)),
  timezone: z.string().min(1).max(64),
});

const createChallengeSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(10).max(5000),
    category: z.string().trim().max(50).optional(),
    visibility: z.enum(["public", "private"]),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    maxParticipants: z.number().int().positive().nullable().optional(),
    tasks: z.array(initialTaskSchema).optional().default([]),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be after or equal to start date.",
    path: ["endDate"],
  });
export async function createChallengeAction(input: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      success: false as const,
      error: "You must be signed in to create a challenge.",
    };
  }

  const validation = createChallengeSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false as const,
      error: validation.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const data = validation.data;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Insert challenge
      const [challenge] = await tx
        .insert(challenges)
        .values({
          creatorId: session.user.id,
          title: data.title,
          description: data.description,
          category: data.category || null,
          visibility: data.visibility,
          status: "active",
          startDate: data.startDate,
          endDate: data.endDate ?? null,
          maxParticipants: data.maxParticipants ?? null,
        })
        .returning({
          id: challenges.id,
          title: challenges.title,
        });

      if (!challenge) {
        throw new Error("Challenge creation failed.");
      }

      // 2. Automatically register creator as participant[cite: 1]
      await tx.insert(challengeMembers).values({
        challengeId: challenge.id,
        userId: session.user.id,
      });

      // 3. Insert initial tasks & schedules so calendar is fully enabled right away
      for (const taskInput of data.tasks) {
        const [task] = await tx
          .insert(challengeTasks)
          .values({
            challengeId: challenge.id,
            title: taskInput.title,
            description: taskInput.description || null,
            createdBy: session.user.id,
          })
          .returning({ id: challengeTasks.id });

        await tx.insert(challengeSchedules).values({
          taskId: task.id,
          frequency: taskInput.frequency,
          weekdays: taskInput.frequency === "daily" ? [] : taskInput.weekdays,
          timezone: taskInput.timezone,
        });
      }

      return challenge;
    });

    revalidatePath("/challenges");

    return {
      success: true as const,
      challenge: result,
    };
  } catch (error) {
    console.error("Create challenge error:", error);

    return {
      success: false as const,
      error: "Unable to create challenge. Please try again.",
    };
  }
}

export async function getPublicChallengesAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: "You must be signed in." };
  }

  try {
    const results = await db
      .select({
        id: challenges.id,
        title: challenges.title,
        description: challenges.description,
        category: challenges.category,
        startDate: challenges.startDate,
        endDate: challenges.endDate,
        maxParticipants: challenges.maxParticipants,
        creatorId: challenges.creatorId,
      })
      .from(challenges)
      .where(and(eq(challenges.visibility, "public"), eq(challenges.status, "active")))
      .orderBy(desc(challenges.createdAt))
      .limit(20);

    return { success: true as const, challenges: results };
  } catch (error) {
    console.error("Get public challenges error:", error);
    return { success: false as const, error: "Unable to load challenges." };
  }
}

export async function getChallengeByIdAction(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: "You must be signed in." };
  }

  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, id))
    .limit(1);

  if (!challenge) {
    return { success: false as const, error: "Challenge not found." };
  }

  if (challenge.visibility === "private" && challenge.creatorId !== session.user.id) {
    return { success: false as const, error: "You don't have permission to view this challenge." };
  }

  return { success: true as const, challenge };
}

export async function getMyChallengesAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: "You must be signed in." };
  }

  try {
    const results = await db
      .select({
        id: challenges.id,
        title: challenges.title,
        description: challenges.description,
        category: challenges.category,
        status: challenges.status,
        startDate: challenges.startDate,
        endDate: challenges.endDate,
        createdAt: challenges.createdAt,
      })
      .from(challenges)
      .where(eq(challenges.creatorId, session.user.id))
      .orderBy(desc(challenges.createdAt));

    return { success: true as const, challenges: results };
  } catch (error) {
    console.error("Get my challenges error:", error);
    return { success: false as const, error: "Unable to load your challenges." };
  }
}

export async function joinChallengeAction(challengeId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: "You must be signed in." };
  }

  try {
    const [existingMembership] = await db
      .select()
      .from(challengeMembers)
      .where(
        and(
          eq(challengeMembers.challengeId, challengeId),
          eq(challengeMembers.userId, session.user.id),
        ),
      )
      .limit(1);

    if (existingMembership && existingMembership.leftAt === null) {
      return { success: false as const, error: "You have already joined this challenge." };
    }

    if (existingMembership) {
      await db
        .update(challengeMembers)
        .set({ leftAt: null })
        .where(eq(challengeMembers.id, existingMembership.id));

      revalidatePath(`/challenges/${challengeId}`);
      return { success: true as const, message: "You have rejoined the challenge." };
    }

    await db.insert(challengeMembers).values({
      challengeId,
      userId: session.user.id,
    });

    revalidatePath(`/challenges/${challengeId}`);
    return { success: true as const, message: "You have joined the challenge." };
  } catch (error) {
    console.error("Join challenge error:", error);
    return { success: false as const, error: "Unable to join this challenge." };
  }
}

export async function leaveChallengeAction(challengeId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: "You must be signed in." };
  }

  try {
    const [membership] = await db
      .update(challengeMembers)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(challengeMembers.challengeId, challengeId),
          eq(challengeMembers.userId, session.user.id),
          isNull(challengeMembers.leftAt),
        ),
      )
      .returning({ id: challengeMembers.id });

    if (!membership) {
      return { success: false as const, error: "You are not an active participant in this challenge." };
    }

    revalidatePath("/challenges");
    revalidatePath(`/challenges/${challengeId}`);
    revalidatePath("/dashboard");

    return { success: true as const, message: "You left the challenge successfully." };
  } catch (error) {
    console.error("Leave challenge error:", error);
    return { success: false as const, error: "Unable to leave this challenge." };
  }
}

export async function getChallengeParticipationAction(challengeId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: "You must be signed in." };
  }

  try {
    const [challenge] = await db
      .select({ creatorId: challenges.creatorId })
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);

    if (!challenge) {
      return { success: false as const, error: "Challenge not found." };
    }

    const isCreator = challenge.creatorId === session.user.id;

    let [membership] = await db
      .select({ id: challengeMembers.id })
      .from(challengeMembers)
      .where(
        and(
          eq(challengeMembers.challengeId, challengeId),
          eq(challengeMembers.userId, session.user.id),
          isNull(challengeMembers.leftAt),
        ),
      )
      .limit(1);

    // Self-healing fallback for legacy challenges created before auto-membership
    if (!membership && isCreator) {
      const [newMembership] = await db
        .insert(challengeMembers)
        .values({
          challengeId,
          userId: session.user.id,
        })
        .returning({ id: challengeMembers.id });

      membership = newMembership;
    }

    const [result] = await db
      .select({ total: count() })
      .from(challengeMembers)
      .where(and(eq(challengeMembers.challengeId, challengeId), isNull(challengeMembers.leftAt)));

    return {
      success: true as const,
      isJoined: Boolean(membership),
      participantCount: Number(result.total),
    };
  } catch (error) {
    console.error("Get participation error:", error);
    return { success: false as const, error: "Unable to retrieve participation information." };
  }
}

const createTaskSchema = z.object({
  challengeId: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
});

export async function createChallengeTaskAction(input: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: "You must be signed in." };
  }

  const validation = createTaskSchema.safeParse(input);

  if (!validation.success) {
    return {
      success: false as const,
      error: validation.error.issues[0]?.message ?? "Invalid task data.",
    };
  }

  const data = validation.data;

  try {
    const [challenge] = await db
      .select({ id: challenges.id, creatorId: challenges.creatorId })
      .from(challenges)
      .where(eq(challenges.id, data.challengeId))
      .limit(1);

    if (!challenge) {
      return { success: false as const, error: "Challenge not found." };
    }

    if (challenge.creatorId !== session.user.id) {
      return { success: false as const, error: "Only the challenge creator can add tasks." };
    }

    const [task] = await db
      .insert(challengeTasks)
      .values({
        challengeId: data.challengeId,
        title: data.title,
        description: data.description || null,
        createdBy: session.user.id,
      })
      .returning();

    if (!task) {
      return { success: false as const, error: "Task creation failed." };
    }

    revalidatePath(`/challenges/${data.challengeId}`);

    return { success: true as const, task };
  } catch (error) {
    console.error("Create task error:", error);
    return { success: false as const, error: "Unable to create task." };
  }
}

export async function getChallengeTasksAction(challengeId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: "You must be signed in." };
  }

  try {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);

    if (!challenge) {
      return { success: false as const, error: "Challenge not found." };
    }

    if (challenge.visibility === "private" && challenge.creatorId !== session.user.id) {
      return { success: false as const, error: "You cannot access this challenge." };
    }

    const tasks = await db
      .select()
      .from(challengeTasks)
      .where(eq(challengeTasks.challengeId, challengeId))
      .orderBy(challengeTasks.createdAt);

    return { success: true as const, tasks };
  } catch (error) {
    console.error("Get challenge tasks error:", error);
    return { success: false as const, error: "Unable to load challenge tasks." };
  }
}

export async function deleteChallengeAction(challengeId: string) {
  const parsed = z.string().uuid().safeParse(challengeId);

  if (!parsed.success) {
    return { success: false as const, error: "Invalid challenge ID." };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false as const, error: "You must be signed in." };
  }

  try {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);

    if (!challenge) {
      return { success: false as const, error: "Challenge not found." };
    }

    if (challenge.creatorId !== session.user.id) {
      return { success: false as const, error: "Only the creator can delete this challenge." };
    }

    await db.delete(challenges).where(eq(challenges.id, challengeId));

    revalidatePath("/challenges");
    revalidatePath("/dashboard");

    return { success: true as const };
  } catch (error) {
    console.error("Delete challenge error:", error);
    return { success: false as const, error: "Unable to delete challenge." };
  }
}

export async function updateChallengeAction(input: {
  challengeId: string;
  title: string;
  description: string;
  category?: string;
  visibility: "public" | "private";
  startDate: string;
  endDate?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = z.object({
      challengeId: z.string().uuid(),
      title: z.string().min(3).max(120),
      description: z.string().min(10).max(5000),
      category: z.string().max(50).optional(),
      visibility: z.enum(["public", "private"]),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).refine(
      (data) => !data.endDate || data.endDate >= data.startDate,
      { message: "End date must be after start date", path: ["endDate"] },
    ).parse(input);

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, validated.challengeId))
      .limit(1);

    if (!challenge) {
      return { success: false, error: "Challenge not found" };
    }

    if (challenge.creatorId !== session.user.id) {
      return {
        success: false,
        error: "You are not authorized to update this challenge",
      };
    }

    await db
      .update(challenges)
      .set({
        title: validated.title,
        description: validated.description,
        category: validated.category || null,
        visibility: validated.visibility,
        startDate: validated.startDate,
        endDate: validated.endDate || null,
        updatedAt: new Date(),
      })
      .where(eq(challenges.id, validated.challengeId));

    revalidatePath(`/challenges/${validated.challengeId}`);
    revalidatePath("/challenges");

    return { success: true };

  } catch (error) {
    console.error("Update challenge error:", error);

    return {
      success: false,
      error: "Failed to update challenge",
    };
  }
}

