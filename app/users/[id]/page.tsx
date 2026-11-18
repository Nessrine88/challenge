
import { notFound } from "next/navigation";

import {
  getPublicUserProfileAction,
  getInviteableChallengesAction,
} from "@/actions/invitation.action";

import { InviteUserButton } from "../invite-user-button";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;

  const [profileResult, challengesResult] = await Promise.all([
    getPublicUserProfileAction(id),
    getInviteableChallengesAction(),
  ]);

  if (!profileResult.success) {
    notFound();
  }

  const profile = profileResult.profile;

  const challenges = challengesResult.success
    ? challengesResult.challenges
    : [];

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <a href="/users" className="text-sm underline">
        ← Discover people
      </a>

      <section className="rounded-xl border p-6">
        <div className="flex items-center gap-4">
          {profile.image ? (
            <img
              src={profile.image}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-gray-500">@{profile.username}</p>
            {profile.country && (
              <p className="mt-1 text-sm text-gray-500">
                {profile.country}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">
          Invite to a challenge
        </h2>

        <InviteUserButton
          userId={profile.id}
          challenges={challenges}
        />
      </section>
    </main>
  );
}
