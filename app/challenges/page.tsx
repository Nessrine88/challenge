export const instant = false;

import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ArrowRight, CalendarDays, Users } from "lucide-react";

import { getPublicChallengesAction } from "@/actions/challenge.action";

export default async function ChallengesPage() {
  const result = await getPublicChallengesAction();

  if (!result.success) {
    if (result.error === "You must be signed in.") {
      redirect("/sign-in");
    }

    throw new Error(result.error);
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Discover challenges
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find a goal and work toward it with others.
          </p>
        </div>

        <Link
          href="/challenges/new"
          aria-label="Create challenge"
          title="Create challenge"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 sm:size-auto sm:px-4 sm:py-2.5"
        >
          <Plus className="size-5" />
          <span className="hidden sm:inline sm:ml-2">Create challenge</span>
        </Link>
      </div>

      {/* Empty state */}
      {result.challenges.length === 0 ? (
        <div className="rounded-xl border border-border px-6 py-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
            <Plus className="size-5 text-muted-foreground" />
          </div>

          <h2 className="mt-4 text-lg font-semibold">No challenges yet</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Be the first to create a challenge.
          </p>

          <Link
            href="/challenges/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Create challenge
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.challenges.map((challenge) => (
            <article
              key={challenge.id}
              className="flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              {/* Category */}
              <p className="text-xs font-medium text-muted-foreground">
                {challenge.category ?? "Uncategorized"}
              </p>

              {/* Title */}
              <h2 className="mt-2 text-lg font-semibold leading-snug">
                {challenge.title}
              </h2>

              {/* Description */}
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {challenge.description.length > 140
                  ? `${challenge.description.slice(0, 140)}...`
                  : challenge.description}
              </p>

              {/* Details */}
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-3.5 shrink-0" />
                  <span>
                    {challenge.startDate} – {challenge.endDate ?? "No end date"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="size-3.5 shrink-0" />
                  <span>
                    Capacity: {challenge.maxParticipants ?? "Unlimited"}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="mt-auto pt-5">
                <Link
                  href={`/challenges/${challenge.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
                >
                  View challenge
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}