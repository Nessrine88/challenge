
"use server";

import { headers } from "next/headers";
import { and, count, desc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { challenges } from "@/db/schema/challenge-schema";

export async function getDashboardDataAction() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      success: false as const,
      error: "Unauthorized",
    };
  }

  try {
    const [recentChallenges, totalResult] = await Promise.all([
      db
        .select({
          id: challenges.id,
          title: challenges.title,
          category: challenges.category,
          status: challenges.status,
          startDate: challenges.startDate,
        })
        .from(challenges)
        .where(eq(challenges.creatorId, session.user.id))
        .orderBy(desc(challenges.createdAt))
        .limit(5),

      db
        .select({ total: count() })
        .from(challenges)
        .where(eq(challenges.creatorId, session.user.id)),
    ]);

    return {
      success: true as const,
      user: {
        name: session.user.name,
        username: session.user.username,
        email: session.user.email,
      },
      totalCreated: totalResult[0]?.total ?? 0,
      recentChallenges,
    };
  } catch (error) {
    console.error("Dashboard data error:", error);

    return {
      success: false as const,
      error: "Unable to load dashboard data.",
    };
  }
}
