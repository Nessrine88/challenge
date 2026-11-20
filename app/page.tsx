import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const DAYS = [
  { day: "Mon", date: "17" },
  { day: "Tue", date: "18" },
  { day: "Wed", date: "19" },
  { day: "Thu", date: "20" },
  { day: "Fri", date: "21" },
  { day: "Sat", date: "22" },
  { day: "Sun", date: "23" },
];

const PREVIEW = [
  {
    name: "You",
    initials: "YO",
    progress: [100, 100, 50, 100, 75, 100, 0],
    isYou: true,
  },
  {
    name: "Alex",
    initials: "AL",
    progress: [100, 75, 100, 50, 100, 100, 50],
    isYou: false,
  },
  {
    name: "Sarah",
    initials: "SA",
    progress: [50, 100, 75, 100, 50, 75, 100],
    isYou: false,
  },
];

const FEATURES = [
  {
    step: "01",
    title: "One target for everyone",
    body: "Create a challenge with a goal and a start and end date. Everyone who joins works toward the same thing.",
  },
  {
    step: "02",
    title: "Tasks on a schedule",
    body: "Add tasks and set how often each repeats: every day or only on chosen weekdays, in your own timezone.",
  },
  {
    step: "03",
    title: "A calendar you share",
    body: "Check in each day and see who else showed up. Progress is visible to every participant.",
  },
];

function ProgressCell({ percentage }: { percentage: number }) {
  if (percentage === 0) {
    return (
      <div className="mx-auto grid size-8 place-items-center rounded-md border border-border/70 bg-muted/30 text-[10px] text-muted-foreground/50">
        —
      </div>
    );
  }

  if (percentage === 100) {
    return (
      <div className="mx-auto grid size-8 place-items-center rounded-md bg-emerald-500 text-[10px] font-semibold text-white shadow-xs">
        100
      </div>
    );
  }

  return (
    <div className="mx-auto grid size-8 place-items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
      {percentage}
    </div>
  );
}

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isSignedIn = Boolean(session?.user);

  return (
    <main className="relative mx-auto w-full max-w-7xl space-y-20 px-4 py-12 sm:px-6 lg:py-20">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-emerald-500/8 via-transparent to-transparent blur-2xl"
      />

      {/* Hero */}
      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Challenges for groups
          </span>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Build a habit together, one check-in at a time
          </h1>

          <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Set a shared target, schedule the tasks, and let everyone tick off
            their day on the same calendar. Friends, teams, and classes stay
            consistent because they can see each other.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              href="/challenges"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
            >
              Browse challenges
            </Link>

            {!isSignedIn && (
              <Link
                href="/sign-in"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium transition-colors hover:bg-secondary"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Realistic shared calendar preview */}
        <div
          aria-hidden="true"
          className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md ring-1 ring-black/5 dark:ring-white/5"
        >
          {/* Header */}
          <div className="border-b border-border/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Shared challenge
                </p>

                <p className="mt-1 truncate text-base font-semibold tracking-tight">
                  14-day morning routine
                </p>
              </div>

              {/* Participant avatars */}
              <div className="flex -space-x-2">
                {PREVIEW.map((participant) => (
                  <div
                    key={participant.initials}
                    className={`grid size-8 place-items-center rounded-full border-2 border-card text-[10px] font-semibold ${
                      participant.isYou
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {participant.initials}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Participants</span>
              <span className="font-medium">3 people</span>
            </div>
          </div>

          {/* Calendar table */}
          <div className="overflow-x-auto p-3 sm:p-4">
            <table className="w-full border-separate border-spacing-1.5 text-xs">
              <thead>
                <tr>
                  <th className="min-w-[92px] pb-2 text-left font-medium text-muted-foreground">
                    Participant
                  </th>

                  {DAYS.map(({ day, date }) => (
                    <th
                      key={date}
                      className="min-w-8 pb-2 text-center font-medium text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px]">{day}</span>
                        <span className="text-xs font-semibold text-foreground">
                          {date}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {PREVIEW.map((participant) => (
                  <tr key={participant.initials}>
                    {/* Participant */}
                    <td className="py-1 pr-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`grid size-7 shrink-0 place-items-center rounded-full text-[9px] font-semibold ${
                            participant.isYou
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {participant.initials}
                        </div>

                        <span
                          className={`truncate text-xs ${
                            participant.isYou
                              ? "font-semibold text-foreground"
                              : "font-medium text-muted-foreground"
                          }`}
                        >
                          {participant.name}
                        </span>
                      </div>
                    </td>

                    {/* Daily progress */}
                    {participant.progress.map((percentage, index) => (
                      <td key={index} className="p-0">
                        <ProgressCell percentage={percentage} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm border border-emerald-500/30 bg-emerald-500/10" />
              <span className="text-xs text-muted-foreground">In progress</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="size-3 rounded-sm border border-border bg-muted/30" />
              <span className="text-xs text-muted-foreground">Not started</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            How it works
          </h2>
        </div>

        <ul className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="group rounded-2xl border border-border/80 bg-card p-6 shadow-2xs transition-colors hover:border-border"
            >
              <span className="inline-flex h-7 w-9 items-center justify-center rounded-md bg-secondary text-xs font-semibold tabular-nums text-muted-foreground">
                {feature.step}
              </span>

              <h3 className="mt-4 font-semibold tracking-tight">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Closing CTA */}
      <section className="rounded-2xl border border-border/80 bg-gradient-to-b from-card to-secondary/30 p-8 text-center shadow-2xs sm:p-12">
        <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Ready to start your first challenge?
        </h2>

        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isSignedIn
            ? "Jump back into your dashboard to check in or launch a new group challenge."
            : "Sign in to create one, or join a public challenge that is already running."}
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
          >
            {isSignedIn ? "Go to dashboard" : "Get started"}
          </Link>
        </div>
      </section>
    </main>
  );
}