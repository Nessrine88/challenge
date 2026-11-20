export const instant = false;

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  ArrowRight,
  Plus,
  Compass,
  Mail,
  UserRound,
  Trophy,
  CalendarDays,
  Users,
  Sparkles,
} from "lucide-react";

import { auth } from "@/lib/auth";

import { getMyChallengesAction } from "@/actions/challenge.action";
import { getPendingInvitationCountAction } from "@/actions/invitation.action";

import { SignOutButton } from "../components/sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

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

  const navigationCards = [
    {
      title: "Create challenge",
      description: "Turn your next goal into a shared challenge.",
      href: "/challenges/new",
      icon: Plus,
      primary: true,
    },
    {
      title: "Discover challenges",
      description: "Explore challenges and find your next goal.",
      href: "/challenges",
      icon: Compass,
      primary: false,
    },
    {
      title: "Invitations",
      description: "View and respond to challenge invitations.",
      href: "/invitations",
      icon: Mail,
      primary: false,
      badge: pendingInvitationsCount,
    },
    {
      title: "My profile",
      description: "Manage your account information.",
      href: "/profile",
      icon: UserRound,
      primary: false,
    },
  ];

  function getCountryFlag(countryCode?: string | null) {
  if (!countryCode) return "";

  const code = countryCode.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(code)) return "";

  return String.fromCodePoint(
    ...[...code].map((char) => 127397 + char.charCodeAt(0))
  );
}

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
  <div className="flex min-w-0 items-center gap-4">
    {/* User image */}
    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
      {session.user.image ? (
        <img
          src={session.user.image}
          alt={session.user.username}
          className="size-full object-cover"
        />
      ) : (
        <span className="text-lg font-semibold text-muted-foreground">
          {session.user.username?.charAt(0).toUpperCase()}
        </span>
      )}
    </div>

    <div className="min-w-0">
      <p className="text-sm font-medium text-muted-foreground">
        Your workspace
      </p>

      <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
        Welcome, {session.user.username}
      </h1>

      <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        {session.user.country && (
          <>
            <span>{getCountryFlag(session.user.country)}</span>
            <span>{session.user.country}</span>
          </>
        )}
      </div>
    </div>
  </div>

  <SignOutButton />
</header>

        {/* Navigation cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {navigationCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  card.primary
                    ? "border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`grid size-10 place-items-center rounded-xl ${
                      card.primary
                        ? "bg-primary-foreground/15"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>

                  {"badge" in card &&
                    typeof card.badge === "number" &&
                    card.badge > 0 && (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                        {card.badge > 99 ? "99+" : card.badge}
                      </span>
                    )}
                </div>

                <div className="mt-5">
                  <h2 className="font-semibold tracking-tight">
                    {card.title}
                  </h2>

                  <p
                    className={`mt-1.5 text-sm leading-relaxed ${
                      card.primary
                        ? "text-primary-foreground/75"
                        : "text-muted-foreground"
                    }`}
                  >
                    {card.description}
                  </p>
                </div>

                <ArrowRight
                  className={`absolute bottom-5 right-5 size-4 transition-transform group-hover:translate-x-1 ${
                    card.primary
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                />
              </Link>
            );
          })}
        </section>

        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Trophy className="size-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Challenges created
              </p>

              <p className="mt-1 text-2xl font-bold tabular-nums">
                {myChallenges.length}
              </p>
            </div>
          </div>

          <Link
            href="/invitations"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
          >
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Mail className="size-5" />
            </div>

            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Pending invitations
              </p>

              <p className="mt-1 text-2xl font-bold tabular-nums">
                {pendingInvitationsCount}
              </p>
            </div>

            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        </section>

        {/* Challenges */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                My challenges
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Your created and ongoing challenges.
              </p>
            </div>

            <Link
              href="/challenges/new"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-secondary"
            >
              <Plus className="size-4" />
              <span>Create new</span>
            </Link>
          </div>

          {/* Error */}
          {!challengesResult.success && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {challengesResult.error}
            </div>
          )}

          {/* Empty state */}
          {challengesResult.success && myChallenges.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
                <Sparkles className="size-5" />
              </div>

              <h3 className="mt-4 font-semibold">
                No challenges yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Create your first challenge and invite others to work toward the
                same goal.
              </p>

              <Link
                href="/challenges/new"
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="size-4" />
                Create your first challenge
              </Link>
            </div>
          )}

          {/* Challenge cards */}
          {myChallenges.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {myChallenges.map((challenge) => (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold tracking-tight transition-colors group-hover:text-primary">
                      {challenge.title}
                    </h3>

                    <span className="shrink-0 rounded-full border border-border bg-secondary/70 px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                      {challenge.status}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {challenge.description || "No description provided."}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {challenge.category || "Uncategorized"}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      Starts {challenge.startDate}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      View challenge
                    </span>

                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}