"use server";

import { and, count, desc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema/notification-schema";

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

export async function getMyNotificationsAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { success: false as const, error: "Unauthorized." };
  }

  try {
    const results = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        message: notifications.message,
        challengeId: notifications.challengeId,
        readAt: notifications.readAt,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.recipientId, currentUser.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return { success: true as const, notifications: results };
  } catch (error) {
    console.error("Get notifications error:", error);
    return { success: false as const, error: "Unable to load notifications." };
  }
}

export async function getUnreadNotificationCountAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { success: false as const, count: 0 };
  }

  try {
    const [result] = await db
      .select({ total: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, currentUser.id),
          isNull(notifications.readAt),
        ),
      );

    return { success: true as const, count: Number(result.total) };
  } catch (error) {
    console.error("Notification count error:", error);
    return { success: false as const, count: 0 };
  }
}

export async function markAllNotificationsReadAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return { success: false as const, error: "Unauthorized." };
  }

  try {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.recipientId, currentUser.id),
          isNull(notifications.readAt),
        ),
      );

    revalidatePath("/notifications");
    revalidatePath("/", "layout");

    return { success: true as const };
  } catch (error) {
    console.error("Mark notifications read error:", error);
    return { success: false as const, error: "Unable to update notifications." };
  }
}