
export const instant = false;

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import {
  getMyChallengesAction,

} from "@/actions/challenge.action";

import   {getPendingInvitationCountAction} from "@/actions/invitation.action";
import { SignOutButton } from "../components/sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Fetch dashboard data
  const [challengesResult, invitationsResult] = await Promise.all([
    getMyChallengesAction(),
    getPendingInvitationCountAction(),
  ]);

  const myChallenges = challengesResult.success
    ? challengesResult.challenges
    : [];

  const pendingInvitationsCount = invitationsResult.success
    ? invitationsResult.count
    : 0;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Your workspace</p>

            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {session.user.name}
            </h1>

            <p className="mt-1 text-gray-600">
              Manage your challenges and track your goals.
            </p>
          </div>

          <SignOutButton />
        </header>

        {/* Main navigation */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Create challenge */}
          <Link
            href="/challenges/new"
            className="rounded-xl bg-black p-6 text-white transition hover:bg-gray-800"
          >
            <h2 className="text-lg font-semibold">
              Create a challenge
            </h2>

            <p className="mt-2 text-sm text-gray-300">
              Turn your next goal into a challenge.
            </p>
          </Link>

          {/* Discover challenges */}
          <Link
            href="/challenges"
            className="rounded-xl border bg-white p-6 transition hover:bg-gray-100"
          >
            <h2 className="text-lg font-semibold">
              Discover challenges
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Explore public challenges and find your next goal.
            </p>
          </Link>

          {/* Invitations */}
          <Link
            href="/invitations"
            className="relative rounded-xl border bg-white p-6 transition hover:bg-gray-100"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">
                Invitations
              </h2>

              {pendingInvitationsCount > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                  {pendingInvitationsCount > 99
                    ? "99+"
                    : pendingInvitationsCount}
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-gray-600">
              View and respond to your challenge invitations.
            </p>

            {pendingInvitationsCount > 0 && (
              <p className="mt-3 text-xs font-medium text-red-600">
                You have {pendingInvitationsCount} pending{" "}
                {pendingInvitationsCount === 1
                  ? "invitation"
                  : "invitations"}
              </p>
            )}
          </Link>

          {/* Profile */}
          <Link
            href="/profile"
            className="rounded-xl border bg-white p-6 transition hover:bg-gray-100"
          >
            <h2 className="text-lg font-semibold">
              My profile
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Manage your account information.
            </p>
          </Link>
        </section>

        {/* Statistics */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Challenges created
            </p>

            <p className="mt-2 text-3xl font-bold">
              {myChallenges.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Pending invitations
            </p>

            <p className="mt-2 text-3xl font-bold">
              {pendingInvitationsCount}
            </p>

            <Link
              href="/invitations"
              className="mt-2 inline-block text-sm font-medium underline"
            >
              View invitations
            </Link>
          </div>
        </section>

        {/* My challenges */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              My challenges
            </h2>

            <Link
              href="/challenges/new"
              className="text-sm font-medium underline"
            >
              Create new
            </Link>
          </div>

          {!challengesResult.success && (
            <p className="text-red-600">
              {challengesResult.error}
            </p>
          )}

          {challengesResult.success && myChallenges.length === 0 && (
            <div className="rounded-xl border border-dashed bg-white p-10 text-center">
              <h3 className="font-semibold">
                No challenges yet
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Create your first challenge to get started.
              </p>

              <Link
                href="/challenges/new"
                className="mt-5 inline-block rounded-md bg-black px-5 py-3 text-white"
              >
                Create your first challenge
              </Link>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {myChallenges.map((challenge) => (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.id}`}
                className="rounded-xl border bg-white p-6 transition hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">
                    {challenge.title}
                  </h3>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                    {challenge.status}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                  {challenge.description}
                </p>

                <div className="mt-4 text-xs text-gray-500">
                  {challenge.category || "Uncategorized"}
                  {" · "}
                  Starts {challenge.startDate}
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
