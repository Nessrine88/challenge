
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";

import { DeleteChallengeButton } from "@/app/components/delete-challenge-button";
import { challengeTasks } from "@/db/schema/task-schema";
import { challengeSchedules } from "@/db/schema/schedule-schema";

import type { Challenge } from "../challenge-form.types";

import {
  getChallengeByIdAction,
  getChallengeParticipationAction,
  getChallengeMembersAction,
} from "@/actions/challenge.action";

import { getChallengeCalendarAction } from "@/actions/checkin.action";

import { ChallengeMembershipButton } from "@/app/components/challenge-membership-button";
import { CreateTaskForm } from "../create-task-form";
import { ChallengeCalendar } from "../challenge-calendar";
import { ChallengeManagementDrawer } from "./challenge-management-drawer";
import { ChallengeMembersList } from "./challenge-members-list";

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

// Converts database dates into values suitable for HTML date inputs.
function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/70 px-4 py-3.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

export default async function ChallengeDetailPage({ params }: Props) {
  const { id } = await params;

  /* ---------------------------------------------------------------------- */
  /* 1. Authentication                                                      */
  /* ---------------------------------------------------------------------- */

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  /* ---------------------------------------------------------------------- */
  /* 2. Load challenge & participation                                      */
  /* ---------------------------------------------------------------------- */

  const [challengeResult, participationResult] = await Promise.all([
    getChallengeByIdAction(id),
    getChallengeParticipationAction(id),
  ]);

  if (!challengeResult.success || !challengeResult.challenge) {
    notFound();
  }

  const challenge = challengeResult.challenge;
  const isCreator = challenge.creatorId === userId;

  const isJoined = Boolean(
    participationResult.success && participationResult.isJoined,
  );

  const participantCount = participationResult.success
    ? participationResult.participantCount
    : 0;

  const isMember = isJoined;
  const isPublic = challenge.visibility === "public";
  const isActive = challenge.status === "active";

  /* ---------------------------------------------------------------------- */
  /* 3. Authorization                                                       */
  /* ---------------------------------------------------------------------- */

  const canAccessChallenge = isPublic || isCreator || isMember;

  if (!canAccessChallenge) {
    notFound();
  }

  const canViewTasks = isCreator || isMember;

  /* ---------------------------------------------------------------------- */
  /* 4. Load tasks, calendar, and members                                   */
  /* ---------------------------------------------------------------------- */

  const [tasks, calendarResult, membersResult] = await Promise.all([
    canViewTasks
      ? db
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
      : Promise.resolve([]),

    isMember ? getChallengeCalendarAction(id) : Promise.resolve(null),

    isCreator ? getChallengeMembersAction(id) : Promise.resolve(null),
  ]);

  const calendarCheckins =
    calendarResult?.success === true ? calendarResult.checkins : [];

  const calendarParticipants =
    calendarResult?.success === true ? calendarResult.participants : [];

  const members =
    membersResult?.success === true ? membersResult.members : [];

  /* ---------------------------------------------------------------------- */
  /* 5. Prepare data for management drawer                                  */
  /* ---------------------------------------------------------------------- */

  const challengeForDrawer: Challenge = {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description ?? "",
    category: challenge.category,
    visibility: challenge.visibility,
    startDate: toDateInputValue(challenge.startDate),
    endDate: toDateInputValue(challenge.endDate) || null,

    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      frequency: task.schedule?.frequency ?? "daily",
      weekdays: task.schedule?.weekdays ?? [],
      timezone: task.schedule?.timezone ?? "UTC",
    })),
  };

  /* ---------------------------------------------------------------------- */
  /* 6. Membership controls                                                 */
  /* ---------------------------------------------------------------------- */

  const canJoin = isPublic && isActive && !isCreator && !isJoined;
  const showMembershipButton = isPublic && !isCreator;
  const canInvite = (isCreator || isMember) && isActive;

  /* ---------------------------------------------------------------------- */
  /* 7. Render                                                              */
  /* ---------------------------------------------------------------------- */

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
      {/* Top breadcrumb */}
      <div>
        <Link
          href="/challenges"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          Back to challenges
        </Link>
      </div>

      {/* Challenge overview */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Challenge information */}
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    isActive
                      ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium capitalize text-emerald-700 dark:text-emerald-400"
                      : "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground"
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

                <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
                  {challenge.visibility}
                </span>

                {challenge.category && (
                  <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {challenge.category}
                  </span>
                )}

                {isCreator && (
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Creator
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-balance break-words text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {challenge.title}
                </h1>

                {challenge.description && (
                  <p className="max-w-2xl text-pretty break-words text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {challenge.description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5 lg:shrink-0 lg:justify-end">
              {canInvite && (
                <Link
                  href="/users"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  <svg
                    viewBox="0 0 16 16"
                    className="size-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.5 13.5v-1a2.5 2.5 0 0 0-2.5-2.5H4.5A2.5 2.5 0 0 0 2 12.5v1" />
                    <circle cx="6.25" cy="5.5" r="2.25" />
                    <path d="M12.5 5.5v4M10.5 7.5h4" />
                  </svg>
                  Invite people
                </Link>
              )}

              {/* Public challenges only: join / leave button */}
              {showMembershipButton && (canJoin || isJoined) && (
                <ChallengeMembershipButton
                  challengeId={id}
                  initialIsJoined={isJoined}
                  initialParticipantCount={participantCount}
                />
              )}

              {/* Creator controls */}
              {isCreator && (
                <ChallengeManagementDrawer challenge={challengeForDrawer}>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">Add a task</h3>

                    <p className="text-sm text-muted-foreground">
                      Create a task and define its schedule.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-background/60 p-4">
                    <CreateTaskForm challengeId={id} />
                  </div>

                  {/* Participants */}
                  {members.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <ChallengeMembersList
                        challengeId={id}
                        members={members}
                        creatorId={challenge.creatorId}
                        currentUserId={userId}
                      />
                    </div>
                  )}

                  <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                    <div>
                      <h3 className="font-semibold text-red-600 dark:text-red-400">
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
              )}
            </div>
          </div>

          {/* Statistics */}
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Participants" value={participantCount} />

            <Stat label="Starts" value={formatDate(challenge.startDate)} />

            <Stat label="Ends" value={formatDate(challenge.endDate)} />

            <Stat
              label="Tasks"
              value={canViewTasks ? tasks.length : "Members only"}
            />
          </dl>
        </div>
      </section>

      {/* Calendar / join state */}
      {isMember ? (
        <section
          aria-label="Shared calendar"
          className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-2xs sm:p-6"
        >
          <ChallengeCalendar
            tasks={tasks}
            checkins={calendarCheckins}
            participants={calendarParticipants}
            startDate={challenge.startDate}
            endDate={challenge.endDate}
            currentUserId={userId}
            isJoined={isJoined}
          />
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center sm:p-10">
          <h2 className="text-lg font-semibold tracking-tight">
            {isPublic
              ? "Join this challenge to track your progress"
              : "Invite-only challenge"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {isPublic
              ? "Become a participant to see the shared calendar and record your daily progress alongside everyone else."
              : isCreator
                ? "Join as a participant or manage tasks and members from the challenge management drawer."
                : "Accept an invitation to view tasks and check in on the shared calendar."}
          </p>

          {/* Only public challenges can be joined directly */}
          {canJoin && (
            <div className="mt-6 flex justify-center">
              <ChallengeMembershipButton
                challengeId={id}
                initialIsJoined={false}
                initialParticipantCount={participantCount}
              />
            </div>
          )}
        </section>
      )}
    </main>
  );
}