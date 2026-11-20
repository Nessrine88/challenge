
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { eq } from "drizzle-orm";

import ProfileForm from "./profile-form";


export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [profile] = await db
    .select({
      name: user.name,
      email: user.email,
      username: user.username,
      country: user.country,
      image: user.image,
      role: user.role,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!profile) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <ProfileForm profile={profile} />
    </main>
  );
}
