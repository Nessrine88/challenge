'use server'
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { challenges } from "@/db/schema/challenge-schema";
import { challengeMembers } from "@/db/schema/membership-schema";
import { challengeTasks } from "@/db/schema/task-schema";
import { challengeSchedules } from "@/db/schema/schedule-schema";
import { challengeCheckins } from "@/db/schema/checkin-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { user } from "@/db/schema/auth-schema";

function getLocalDate(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}


const checkinSchema = z.object({
  taskId: z.string().uuid(),
  checkinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(1000).optional(),
});

export async function createCheckinAction(input: {
  taskId: string;
  checkinDate: string;
  note?: string;
}) {
  const parsed = checkinSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid check-in information.",
    };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      success: false,
      error: "You must be signed in.",
    };
  }

  const { taskId, checkinDate, note } = parsed.data;

  // Validate that the date actually exists.
  const parsedDate = new Date(`${checkinDate}T12:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== checkinDate
  ) {
    return {
      success: false,
      error: "Invalid calendar date.",
    };
  }

  // Find the task.
  const [task] = await db
    .select()
    .from(challengeTasks)
    .where(eq(challengeTasks.id, taskId))
    .limit(1);

  if (!task) {
    return {
      success: false,
      error: "Task not found.",
    };
  }

  // Find its challenge.
  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, task.challengeId))
    .limit(1);

  if (!challenge || challenge.status !== "active") {
    return {
      success: false,
      error: "Challenge is not active.",
    };
  }

  // Check that the user is an active member.
  const [membership] = await db
    .select()
    .from(challengeMembers)
    .where(
      and(
        eq(challengeMembers.challengeId, task.challengeId),
        eq(challengeMembers.userId, session.user.id),
        isNull(challengeMembers.leftAt),
      ),
    )
    .limit(1);

  if (!membership) {
    return {
      success: false,
      error: "You are not an active participant.",
    };
  }

  // Find the task schedule.
  const [schedule] = await db
    .select()
    .from(challengeSchedules)
    .where(eq(challengeSchedules.taskId, taskId))
    .limit(1);

  if (!schedule) {
    return {
      success: false,
      error: "This task has no schedule.",
    };
  }

  // Validate the timezone and determine today's local date.
  let today: string;

  try {
    today = getLocalDate(schedule.timezone);
  } catch {
    return {
      success: false,
      error: "Invalid schedule timezone.",
    };
  }

  if (checkinDate > today) {
    return {
      success: false,
      error: "You cannot check in for a future date.",
    };
  }

  if (
    checkinDate < challenge.startDate ||
    (challenge.endDate && checkinDate > challenge.endDate)
  ) {
    return {
      success: false,
      error: "Date is outside the challenge period.",
    };
  }

  // Check whether this task was scheduled on that date.
  if (schedule.frequency === "selected_days") {
    const weekday = parsedDate.getUTCDay();

    if (!schedule.weekdays.includes(weekday)) {
      return {
        success: false,
        error: "This task is not scheduled for that day.",
      };
    }
  }

  // Insert the check-in.
  const [checkin] = await db
    .insert(challengeCheckins)
    .values({
      membershipId: membership.id,
      taskId,
      checkinDate,
      note,
    })
    .onConflictDoNothing()
    .returning();

  if (!checkin) {
    return {
      success: false,
      error: "You have already checked in for this task on that date.",
    };
  }

  return {
    success: true,
    checkin,
  };
}

export async function getChallengeCheckinsAction(challengeId: string) {
  const parsed = z.string().uuid().safeParse(challengeId);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid challenge ID.",
    };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      success: false,
      error: "You must be signed in.",
    };
  }

  // Find the participant's active membership.
  const [membership] = await db
    .select()
    .from(challengeMembers)
    .where(
      and(
        eq(challengeMembers.challengeId, challengeId),
        eq(challengeMembers.userId, session.user.id),
        isNull(challengeMembers.leftAt),
      ),
    )
    .limit(1);

  if (!membership) {
    return {
      success: false,
      error: "You are not an active participant.",
    };
  }

  // Retrieve check-ins with their task titles.
  const checkins = await db
    .select({
      id: challengeCheckins.id,
      taskId: challengeCheckins.taskId,
      taskTitle: challengeTasks.title,
      checkinDate: challengeCheckins.checkinDate,
      note: challengeCheckins.note,
      createdAt: challengeCheckins.createdAt,
    })
    .from(challengeCheckins)
    .innerJoin(
      challengeTasks,
      eq(challengeCheckins.taskId, challengeTasks.id),
    )
    .where(
      and(
        eq(challengeCheckins.membershipId, membership.id),
        eq(challengeTasks.challengeId, challengeId),
      ),
    )
    .orderBy(challengeCheckins.checkinDate);

  return {
    success: true,
    checkins,
  };
}


const scheduleInputSchema = z.object({
  challengeId: z.string().uuid(),
  taskId: z.string().uuid(),
  frequency: z.enum(["daily", "selected_days"]),
  weekdays: z.array(z.number().int().min(0).max(6)),
  timezone: z.string().min(1).max(64),
}).superRefine((data, ctx) => {
  if (
    data.frequency === "daily" &&
    data.weekdays.length !== 0
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Daily schedules must not specify weekdays.",
      path: ["weekdays"],
    });
  }

  if (
    data.frequency === "selected_days" &&
    (data.weekdays.length === 0 ||
      new Set(data.weekdays).size !== data.weekdays.length)
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Select at least one unique weekday.",
      path: ["weekdays"],
    });
  }
});

export async function createChallengeScheduleAction(input: {
  challengeId: string;
  taskId: string;
  frequency: "daily" | "selected_days";
  weekdays: number[];
  timezone: string;
}) {
  const parsed = scheduleInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid schedule information.",
    };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      success: false,
      error: "You must be signed in.",
    };
  }

  const {
    challengeId,
    taskId,
    frequency,
    weekdays,
    timezone,
  } = parsed.data;

  // Validate the timezone.
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });
  } catch {
    return {
      success: false,
      error: "Invalid timezone.",
    };
  }

  // Verify challenge ownership.
  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1);

  if (!challenge || challenge.creatorId !== session.user.id) {
    return {
      success: false,
      error: "Only the challenge creator can configure schedules.",
    };
  }

  // Verify that the task belongs to this challenge.
  const [task] = await db
    .select()
    .from(challengeTasks)
    .where(
      and(
        eq(challengeTasks.id, taskId),
        eq(challengeTasks.challengeId, challengeId),
      ),
    )
    .limit(1);

  if (!task) {
    return {
      success: false,
      error: "Task not found in this challenge.",
    };
  }

  // Create or update the task schedule.
  const [schedule] = await db
    .insert(challengeSchedules)
    .values({
      taskId,
      frequency,
      weekdays,
      timezone,
    })
    .onConflictDoUpdate({
      target: challengeSchedules.taskId,
      set: {
        frequency,
        weekdays,
        timezone,
        updatedAt: new Date(),
      },
    })
    .returning();

  revalidatePath(`/challenges/${challengeId}`);

  return {
    success: true,
    schedule,
  };
}

export async function getChallengeCalendarAction(challengeId: string) {
  const parsed = z.string().uuid().safeParse(challengeId);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Invalid challenge ID.",
    };
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      success: false as const,
      error: "You must be signed in.",
    };
  }

  // 1. Verify that the challenge exists.
  const [challenge] = await db
    .select({
      id: challenges.id,
      creatorId: challenges.creatorId,
    })
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1);

  if (!challenge) {
    return {
      success: false as const,
      error: "Challenge not found.",
    };
  }

  // 2. Allow the creator or an active participant to view the calendar.
  const isCreator = challenge.creatorId === session.user.id;

  if (!isCreator) {
    const [membership] = await db
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

    if (!membership) {
      return {
        success: false as const,
        error: "You cannot access this challenge calendar.",
      };
    }
  }

  // 3. Retrieve check-ins from every participant.
  const checkins = await db
    .select({
      id: challengeCheckins.id,
      membershipId: challengeMembers.id,
      participantId: challengeMembers.userId,
      participantUsername: user.username,
      taskId: challengeCheckins.taskId,
      taskTitle: challengeTasks.title,
      checkinDate: challengeCheckins.checkinDate,
      note: challengeCheckins.note,
      createdAt: challengeCheckins.createdAt,
    })
    .from(challengeCheckins)
    .innerJoin(
      challengeMembers,
      eq(challengeCheckins.membershipId, challengeMembers.id),
    )
    .innerJoin(
      user,
      eq(challengeMembers.userId, user.id),
    )
    .innerJoin(
      challengeTasks,
      eq(challengeCheckins.taskId, challengeTasks.id),
    )
    .where(eq(challengeTasks.challengeId, challengeId))
    .orderBy(
      challengeCheckins.checkinDate,
      challengeTasks.createdAt,
    );

  return {
    success: true as const,
    checkins,
  };
}