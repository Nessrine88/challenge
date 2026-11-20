import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { challengeMembers } from "@/db/schema/membership-schema";
import { notifications } from "@/db/schema/notification-schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type NotifyOptions = {
  challengeId: string;
  actorId: string;
  type: "member_left" | "member_removed";
  message: string;
  excludeUserIds?: string[];
};

/**
 * Creates one notification for every ACTIVE member of the challenge,
 * except the actor and anyone in `excludeUserIds`.
 *
 * Call this inside the same transaction that changed the membership so the
 * notification and the change either both happen or neither does.
 */
export async function notifyChallengeMembers(tx: Tx, options: NotifyOptions) {
  const { challengeId, actorId, type, message, excludeUserIds = [] } = options;

  const members = await tx
    .select({ userId: challengeMembers.userId })
    .from(challengeMembers)
    .where(
      and(
        eq(challengeMembers.challengeId, challengeId),
        isNull(challengeMembers.leftAt),
      ),
    );

  const skip = new Set([actorId, ...excludeUserIds]);
  const recipients = members
    .map((member) => member.userId)
    .filter((userId) => !skip.has(userId));

  if (recipients.length === 0) return;

  await tx.insert(notifications).values(
    recipients.map((recipientId) => ({
      recipientId,
      actorId,
      challengeId,
      type,
      message,
    })),
  );
}