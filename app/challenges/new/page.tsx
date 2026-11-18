
export const instant = false;

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { CreateChallengeForm } from "../create-challenge-form";

export default async function NewChallengePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">
        Create a challenge
      </h1>

      <p className="mt-2 text-gray-600">
        Define a goal and invite others to work toward it together.
      </p>

      <div className="mt-8">
        <CreateChallengeForm mode="create" />
      </div>
    </main>
  );
}
