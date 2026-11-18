
import Link from "next/link";

import {
  getUsersAction,
  getInviteableChallengesAction,
} from "@/actions/invitation.action";

import { InviteUserButton } from "./invite-user-button";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function UsersPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;

  const [usersResult, challengesResult] = await Promise.all([
    getUsersAction(q),
    getInviteableChallengesAction(),
  ]);

  if (!usersResult.success) {
    return <p className="p-8">Unable to load users.</p>;
  }

  const users = usersResult.users;
  const challenges = challengesResult.success
    ? challengesResult.challenges
    : [];

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Discover people</h1>
        <p className="mt-2 text-gray-500">
          Find other registered users and invite them to your challenges.
        </p>
      </div>

      <form action="/users" method="GET">
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name or username..."
            className="w-full rounded-lg border p-3"
          />

          <button
            type="submit"
            className="rounded-lg bg-black px-5 text-white"
          >
            Search
          </button>
        </div>
      </form>

      <p className="text-sm text-gray-500">
        {users.length} users found
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {users.map((item) => (
          <article
            key={item.id}
            className="space-y-4 rounded-xl border p-5"
          >
            <div className="flex items-center gap-3">
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 font-semibold">
                  {item.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="font-semibold">{item.name}</h2>
                <p className="text-sm text-gray-500">
                  @{item.username}
                </p>
                {item.country && (
                  <p className="text-xs text-gray-500">
                    {item.country}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={`/users/${encodeURIComponent(item.id)}`}
                className="text-sm underline"
              >
                View profile
              </Link>

              <InviteUserButton
                userId={item.id}
                challenges={challenges}
              />
            </div>
          </article>
        ))}
      </div>

      {users.length === 0 && (
        <p className="py-10 text-center text-gray-500">
          No users found.
        </p>
      )}
    </main>
  );
}
