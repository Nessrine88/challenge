import Link from "next/link";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Decorative preview of the shared calendar (1 = checked in).
const PREVIEW = [
  { task: "Wake up at 6:30", marks: [1, 1, 1, 0, 1, 1, 0] },
  { task: "30 min of exercise", marks: [1, 0, 1, 1, 0, 1, 1] },
  { task: "Read 20 pages", marks: [1, 1, 0, 1, 1, 0, 0] },
];

const FEATURES = [
  {
    title: "One target for everyone",
    body: "Create a challenge with a goal and a start and end date. Everyone who joins works toward the same thing.",
  },
  {
    title: "Tasks on a schedule",
    body: "Add tasks and set how often each repeats: every day or only on chosen weekdays, in your own timezone.",
  },
  {
    title: "A calendar you share",
    body: "Check in each day and see who else showed up. Progress is visible to every participant.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:py-20">
      {/* Hero */}
      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Challenges for groups
          </span>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Build a habit together, one check-in at a time
          </h1>

          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Set a shared target, schedule the tasks, and let everyone tick off
            their day on the same calendar. Friends, teams and classes stay
            consistent because they can see each other.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              href="/challenges"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse challenges
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium transition-colors hover:bg-secondary"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Calendar preview */}
        <div
          aria-hidden="true"
          className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Shared target
              </p>
              <p className="font-semibold">14-day morning routine</p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
              3 participants
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="pr-3 text-left font-medium">Task</th>
                  {DAYS.map((d) => (
                    <th key={d} className="min-w-9 px-1 text-center font-medium">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PREVIEW.map((row) => (
                  <tr key={row.task}>
                    <td className="whitespace-nowrap pr-3 font-medium">
                      {row.task}
                    </td>
                    {row.marks.map((on, i) => (
                      <td key={i} className="px-1">
                        <span
                          className={
                            on
                              ? "mx-auto grid size-7 place-items-center rounded-md bg-emerald-500 text-white"
                              : "mx-auto grid size-7 place-items-center rounded-md border border-border"
                          }
                        >
                          {on ? (
                            <svg
                              viewBox="0 0 16 16"
                              className="size-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 8.5l3.2 3.2L13 4.8" />
                            </svg>
                          ) : null}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>

        <ul className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Closing call to action */}
      <section className="rounded-2xl border border-border bg-card p-8 text-center sm:p-10">
        <h2 className="text-balance text-2xl font-semibold tracking-tight">
          Ready to start your first challenge?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Sign in to create one, or join a public challenge that is already
          running.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started
          </Link>
        </div>
      </section>
    </main>
  );
}