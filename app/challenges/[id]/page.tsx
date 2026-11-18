
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

import {
  getChallengeCalendarAction,
} from "@/actions/checkin.action";

import { ChallengeMembershipButton } from "@/app/components/challenge-membership-button";
import { CreateTaskForm } from "../create-task-form";
import { ChallengeScheduleForm } from "../challenge-schedule-form";
import { ChallengeCalendar } from "../challenge-calendar";

type Props = {
  params: Promise<{ id: string }>;
};

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

  if (!challengeResult.success) {
    notFound();
  }

  const challenge = challengeResult.challenge;

  if (!challenge) {
    notFound();
  }

  // 3. Retrieve participation information.
  const participationResult =
    await getChallengeParticipationAction(id);

  const isCreator = challenge.creatorId === session.user.id;

  const isJoined =
    participationResult.success &&
    participationResult.isJoined;

  const participantCount =
    participationResult.success
      ? participationResult.participantCount
      : 0;

  // 4. Retrieve tasks and their schedules.
  const tasks = await db
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
    .orderBy(challengeTasks.createdAt);

  // 5. Retrieve shared calendar check-ins.
  const calendarResult =
    isJoined || isCreator
      ? await getChallengeCalendarAction(id)
      : null;

  const calendarCheckins =
    calendarResult?.success
      ? calendarResult.checkins
      : [];

  // 6. Determine whether the user can join.
  const canJoin =
    challenge.visibility === "public" &&
    challenge.status === "active" &&
    !isCreator &&
    !isJoined;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8">

      {/* Challenge header */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
                {challenge.status}
              </span>

              <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                {challenge.visibility}
              </span>

              {challenge.category && (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                  {challenge.category}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              {challenge.title}
            </h1>

            <p className="max-w-2xl text-muted-foreground">
              {challenge.description}
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
              <span>
                Starts: {challenge.startDate}
              </span>

              {challenge.endDate && (
                <span>
                  Ends: {challenge.endDate}
                </span>
              )}

              <span>
                {participantCount} participants
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {canJoin && (
              <ChallengeMembershipButton
                challengeId={id}
                initialIsJoined={isJoined}
                initialParticipantCount={participantCount}
              />
            )}

            {isJoined && (
              <ChallengeMembershipButton
                challengeId={id}
                initialIsJoined={isJoined}
                initialParticipantCount={participantCount}
              />
            )}

            {isCreator && (
              <span className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium">
                Challenge creator
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Creator management section */}
      {isCreator && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">
              Manage challenge
            </h2>
            <p className="text-sm text-muted-foreground">
              Add tasks and configure their schedules.
            </p>
          </div>

          <div className="rounded-xl border border-border p-5">
            <h3 className="mb-4 font-semibold">
              Add a task
            </h3>

            <CreateTaskForm challengeId={id} />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">
              Task schedules
            </h3>

            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-border p-5"
              >
                <div className="mb-4">
                  <h4 className="font-medium">
                    {task.title}
                  </h4>

                  {task.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  )}
                </div>

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
            ))}

            {tasks.length === 0 && (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No tasks yet. Add your first task above.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Shared calendar */}
      {(isJoined || isCreator) && (
        <ChallengeCalendar
          tasks={tasks}
          checkins={calendarCheckins}
          startDate={challenge.startDate}
          endDate={challenge.endDate}
          currentUserId={session.user.id}
          isJoined={isJoined}
        />
      )}

      {/* Non-member information */}
      {!isJoined && !isCreator && (
        <section className="rounded-xl border border-border p-6">
          <h2 className="font-semibold">
            Join this challenge to track your progress
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Become a participant to access the shared tracking calendar
            and record your daily progress.
          </p>
        </section>
      )}
{isCreator && (
  <section className="space-y-6">
    <h2 className="text-xl font-semibold">Manage challenge</h2>

    <CreateTaskForm challengeId={id} />

    {/* Task schedules */}
    {/* Your existing schedule forms */}

    {/* Only the creator can see this */}
    <div className="border-t border-border pt-6">
      <DeleteChallengeButton challengeId={id} />
    </div>
  </section>
)}
    </main>
  );
}
