export const instant = false;
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";

import { DeleteChallengeButton } from "@/app/components/delete-challenge-button";
import { challengeTasks } from "@/db/schema/task-schema";
import { challengeSchedules } from "@/db/schema/schedule-schema";

import {
  getChallengeByIdAction,
  getChallengeParticipationAction,
} from "@/actions/challenge.action";

import { getChallengeCalendarAction } from "@/actions/checkin.action";

import { ChallengeMembershipButton } from "@/app/components/challenge-membership-button";
import { CreateTaskForm } from "../create-task-form";
import { ChallengeScheduleForm } from "../challenge-schedule-form";
import { ChallengeCalendar } from "../challenge-calendar";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "No end date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export default async function ChallengeDetailPage({ params }: Props) {
  const { id } = await params;

  // 1. Authenticate the user.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // 2. Retrieve the challenge.
  const challengeResult = await getChallengeByIdAction(id);

  if (!challengeResult.success || !challengeResult.challenge) {
    notFound();
  }

  const challenge = challengeResult.challenge;

  // 3. Retrieve participation information.
  const participationResult = await getChallengeParticipationAction(id);

  const isCreator = challenge.creatorId === session.user.id;
  const isJoined =
    participationResult.success && participationResult.isJoined;
  const participantCount = participationResult.success
    ? participationResult.participantCount
    : 0;

  const isMember = isJoined || isCreator;

  // 4. Retrieve tasks and their schedules (members only).
  const tasks = isMember
    ? await db
        .select({
          id: challengeTasks.id,
          title: challengeTasks.title,
          description: challengeTasks.description,
          schedule: {
            id: challengeSchedules.id,
            frequency: challengeSchedules.frequency,
            weekdays: challengeSchedules.weekdays,
            timezone: challengeSchedules.timezone,
          },
        })
        .from(challengeTasks)
        .leftJoin(
          challengeSchedules,
          eq(challengeTasks.id, challengeSchedules.taskId),
        )
        .where(eq(challengeTasks.challengeId, id))
        .orderBy(challengeTasks.createdAt)
    : [];

  // 5. Retrieve shared calendar check-ins (members only).
  const calendarResult = isMember
    ? await getChallengeCalendarAction(id)
    : null;

  const calendarCheckins = calendarResult?.success
    ? calendarResult.checkins
    : [];

  // 6. Determine whether the user can join.
  const canJoin =
    challenge.visibility === "public" &&
    challenge.status === "active" &&
    !isCreator &&
    !isJoined;

  // The creator manages the challenge and does not join or leave it.
  const showMembershipButton = !isCreator && (canJoin || isJoined);

  const isActive = challenge.status === "active";

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
      {/* Header */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    isActive
                      ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium capitalize text-emerald-600 dark:text-emerald-400"
                      : "inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground"
                  }
                >
                  <span
                    className={
                      isActive
                        ? "size-1.5 rounded-full bg-emerald-500"
                        : "size-1.5 rounded-full bg-muted-foreground"
                    }
                  />
                  {challenge.status}
                </span>

                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
                  {challenge.visibility}
                </span>

                {challenge.category && (
                  <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                    {challenge.category}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                  {challenge.title}
                </h1>

                {challenge.description && (
                  <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
                    {challenge.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {showMembershipButton && (
                <ChallengeMembershipButton
                  challengeId={id}
                  initialIsJoined={isJoined}
                  initialParticipantCount={participantCount}
                />
              )}

              {isCreator && (
                <span className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium">
                  Challenge creator
                </span>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Participants" value={participantCount} />
            <Stat label="Starts" value={formatDate(challenge.startDate)} />
            <Stat label="Ends" value={formatDate(challenge.endDate)} />
            <Stat
              label="Tasks"
              value={isMember ? tasks.length : "Members only"}
            />
          </dl>
        </div>
      </section>

      {/* Members: calendar, plus the creator's tools beside it */}
      {isMember ? (
        <div
          className={
            isCreator
              ? "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
              : "grid gap-6"
          }
        >
          <section
            aria-label="Shared calendar"
            className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6"
          >
            <ChallengeCalendar
              tasks={tasks}
              checkins={calendarCheckins}
              startDate={challenge.startDate}
              endDate={challenge.endDate}
              currentUserId={session.user.id}
              isJoined={isJoined}
            />
          </section>

          {isCreator && (
            <aside className="space-y-4 lg:sticky lg:top-6">
              <div className="px-1">
                <h2 className="text-lg font-semibold">Manage challenge</h2>
                <p className="text-sm text-muted-foreground">
                  Add tasks and set when each one repeats.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold">Add a task</h3>
                <CreateTaskForm challengeId={id} />
              </div>

              <div className="rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <h3 className="text-sm font-semibold">Task schedules</h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                    {tasks.length}
                  </span>
                </div>

                {tasks.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    No tasks yet. Add your first task above.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {tasks.map((task) => (
                      <li key={task.id}>
                        <details className="group">
                          <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-5 py-4 hover:bg-secondary/40 [&::-webkit-details-marker]:hidden">
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {task.title}
                              </p>
                              <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                                {task.schedule?.frequency ?? "daily"}
                                {task.schedule?.timezone
                                  ? ` · ${task.schedule.timezone}`
                                  : ""}
                              </p>
                            </div>
                            <span
                              aria-hidden="true"
                              className="mt-1 text-muted-foreground transition-transform group-open:rotate-180"
                            >
                              ▾
                            </span>
                          </summary>

                          <div className="space-y-3 border-t border-border bg-secondary/20 px-5 py-4">
                            {task.description && (
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            )}

                            <ChallengeScheduleForm
                              challengeId={id}
                              taskId={task.id}
                              initialFrequency={
                                task.schedule?.frequency ?? "daily"
                              }
                              initialWeekdays={task.schedule?.weekdays ?? []}
                              initialTimezone={
                                task.schedule?.timezone ?? "UTC"
                              }
                            />
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Only the creator can see this */}
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
                <h3 className="text-sm font-semibold text-destructive">
                  Danger zone
                </h3>
                <p className="mb-4 mt-1 text-sm text-muted-foreground">
                  Deleting this challenge removes its tasks and check-ins for
                  everyone.
                </p>
                <DeleteChallengeButton challengeId={id} />
              </div>
            </aside>
          )}
        </div>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">
            Join this challenge to track your progress
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Become a participant to see the shared calendar and record your
            daily progress alongside everyone else.
          </p>
        </section>
      )}
    </main>
  );
}