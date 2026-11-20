
"use server";

import { and, eq, ilike, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters.").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must contain at least 3 characters.")
    .max(30, "Username cannot exceed 30 characters.")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores.",
    ),
  country: z.string().trim().max(80).optional(),
  image: z.union([
    z.literal(""),
    z.string().trim().url("Enter a valid image URL.").max(2048),
  ]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

type ActionResult = {
  success: boolean;
  message: string;
};

export async function updateProfileAction(
  values: ProfileInput,
): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be signed in to update your profile.",
      };
    }

    const parsed = profileSchema.safeParse(values);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid profile information.",
      };
    }

    const { name, username, country, image } = parsed.data;

    const existingUsername = await db
      .select({ id: user.id })
      .from(user)
      .where(
        and(
          ilike(user.username, username),
          ne(user.id, session.user.id),
        ),
      )
      .limit(1);

    if (existingUsername.length > 0) {
      return {
        success: false,
        message: "This username is already taken.",
      };
    }

    await db
      .update(user)
      .set({
        name,
        username,
        country: country || null,
        image: image || null,
      })
      .where(eq(user.id, session.user.id));

    revalidatePath("/profile");

    return {
      success: true,
      message: "Your profile has been updated successfully.",
    };
  } catch (error) {
    console.error("Profile update error:", error);

    return {
      success: false,
      message: "Something went wrong while updating your profile.",
    };
  }
}
