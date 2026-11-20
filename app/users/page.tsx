import Link from "next/link";
import { UserRound } from "lucide-react";

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
  const query = q.trim();

  const [usersResult, challengesResult] = await Promise.all([
    getUsersAction(query),
    getInviteableChallengesAction(),
  ]);

  if (!usersResult.success) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-red-600 dark:text-red-400">
          Unable to load users right now.
        </p>
      </main>
    );
  }

  const users = usersResult.users;
  const challenges = challengesResult.success
    ? challengesResult.challenges
    : [];

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8 sm:px-6 lg:py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Discover people
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find people and invite them to challenges.
        </p>
      </div>

      <form action="/users" method="GET" className="flex items-stretch gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search users..."
          aria-label="Search users"
          className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />

        <button
          type="submit"
          aria-label="Search"
          title="Search"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5L14 14" />
          </svg>
        </button>

        {query && (
          <Link
            href="/users"
            aria-label="Clear search"
            title="Clear search"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </Link>
        )}
      </form>

      <p className="text-xs text-muted-foreground">
        {users.length} {users.length === 1 ? "user" : "users"}
        {query && ` · "${query}"`}
      </p>

      {users.length > 0 ? (
        <ul className="divide-y divide-border border-y border-border">
          {users.map((item) => {
            const displayName = item.name?.trim() || item.username || "User";
            const initial = displayName.charAt(0).toUpperCase();

            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <Link
                  href={`/users/${encodeURIComponent(item.id)}`}
                  className="group flex min-w-0 items-center gap-2.5"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={displayName}
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                      {initial}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground group-hover:underline">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.username && `@${item.username}`}
                      {item.username && item.country && " · "}
                      {item.country}
                    </p>
                  </div>
                </Link>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href={`/users/${encodeURIComponent(item.id)}`}
                    aria-label={`View ${displayName}'s profile`}
                    title="View profile"
                    className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <UserRound className="size-4" />
                  </Link>

                  <InviteUserButton
                    userId={item.id}
                    challenges={challenges}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-t border-border py-10 text-center text-sm text-muted-foreground">
          No users found{query ? ` for "${query}"` : ""}.
        </p>
      )}
    </main>
  );
}