
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
import { ChallengeManagementDrawer } from "./challenge-management-drawer";

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

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  );
}

export default async function ChallengeDetailPage({ params }: Props) {
  const { id } = await params;

  // 1. Authenticate user.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // 2. Retrieve challenge.
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

  // 4. Retrieve tasks and schedules for members.
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

  // 5. Retrieve shared calendar.
  const calendarResult = isMember
    ? await getChallengeCalendarAction(id)
    : null;

  const calendarCheckins =
    calendarResult?.success ? calendarResult.checkins : [];

  const calendarParticipants =
    calendarResult?.success ? calendarResult.participants : [];

  // 6. Determine membership button visibility.
  const canJoin =
    challenge.visibility === "public" &&
    challenge.status === "active" &&
    !isCreator &&
    !isJoined;

  const showMembershipButton = !isCreator && (canJoin || isJoined);

  const isActive = challenge.status === "active";

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
      {/* Challenge header */}
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

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {showMembershipButton && (
                <ChallengeMembershipButton
                  challengeId={id}
                  initialIsJoined={isJoined}
                  initialParticipantCount={participantCount}
                />
              )}

              {isCreator && (
                <>
                  <span className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium">
                    Challenge creator
                  </span>

                  <ChallengeManagementDrawer>
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold">
                        Add a task
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Create a task and define its schedule.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <CreateTaskForm challengeId={id} />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-base font-semibold">
                          Task schedules
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Configure when each task should repeat.
                        </p>
                      </div>

                      {tasks.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                          No tasks yet. Add your first task above.
                        </p>
                      ) : (
                        <ul className="divide-y divide-border rounded-xl border border-border">
                          {tasks.map((task) => (
                            <li key={task.id}>
                              <details className="group">
                                <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-4 hover:bg-secondary/40 [&::-webkit-details-marker]:hidden">
                                  <div className="min-w-0">
                                    <p className="font-medium">
                                      {task.title}
                                    </p>

                                    <p className="mt-1 text-xs capitalize text-muted-foreground">
                                      {task.schedule?.frequency ?? "daily"}
                                      {task.schedule?.timezone
                                        ? ` · ${task.schedule.timezone}`
                                        : ""}
                                    </p>
                                  </div>

                                  <span className="text-muted-foreground transition-transform group-open:rotate-180">
                                    ▾
                                  </span>
                                </summary>

                                <div className="space-y-3 border-t border-border bg-secondary/20 px-4 py-4">
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
                                    initialWeekdays={
                                      task.schedule?.weekdays ?? []
                                    }
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

                    <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                      <div>
                        <h3 className="font-semibold text-destructive">
                          Danger zone
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Deleting this challenge removes its tasks and check-ins
                          for everyone.
                        </p>
                      </div>

                      <DeleteChallengeButton challengeId={id} />
                    </div>
                  </ChallengeManagementDrawer>
                </>
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

      {/* Shared calendar */}
      {isMember ? (
        <section
          aria-label="Shared calendar"
          className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6"
        >
          <ChallengeCalendar
            tasks={tasks}
            checkins={calendarCheckins}
            participants={calendarParticipants}
            startDate={challenge.startDate}
            endDate={challenge.endDate}
            currentUserId={session.user.id}
            isJoined={isJoined}
          />
        </section>
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
