export const instant = false;

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
  /* 2. Load challenge                                                      */
  /*    getChallengeByIdAction already returns "not found" for private      */
  /*    challenges when the viewer is neither the creator nor an active     */
  /*    participant (this covers pending invitees and non-members).         */
  /* ---------------------------------------------------------------------- */

  const challengeResult = await getChallengeByIdAction(id);

  if (!challengeResult.success || !challengeResult.challenge) {
    notFound();
  }

  const challenge = challengeResult.challenge;

  const isCreator = challenge.creatorId === userId;

  /* ---------------------------------------------------------------------- */
  /* 3. Load membership                                                     */
  /* ---------------------------------------------------------------------- */

  const participationResult = await getChallengeParticipationAction(id);

  const isJoined =
    participationResult.success && participationResult.isJoined;

  const participantCount = participationResult.success
    ? participationResult.participantCount
    : 0;

  const isMember = isJoined;

  /* ---------------------------------------------------------------------- */
  /* 4. Authorization                                                       */
  /* ---------------------------------------------------------------------- */

  const isPublic = challenge.visibility === "public";

  /**
   * Access rules:
   *
   * Public challenge:
   * - Everyone authenticated can view the challenge details.
   *
   * Private challenge:
   * - Creator can view.
   * - Accepted participants (active members) can view.
   * - Pending invitees cannot view the challenge.
   * - Non-invited users cannot view the challenge.
   */

  const canAccessChallenge = isPublic || isCreator || isMember;

  if (!canAccessChallenge) {
    notFound();
  }

  /**
   * Tasks:
   * - Creator can view tasks.
   * - Accepted participants can view tasks.
   * - Public non-members can see challenge details, but not tasks.
   */

  const canViewTasks = isCreator || isMember;

  /* ---------------------------------------------------------------------- */
  /* 5. Load tasks and schedules                                            */
  /* ---------------------------------------------------------------------- */

  const tasks = canViewTasks
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

  /* ---------------------------------------------------------------------- */
  /* 6. Prepare data for management drawer                                  */
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
  /* 7. Calendar data                                                       */
  /* ---------------------------------------------------------------------- */

  const calendarResult = isMember
    ? await getChallengeCalendarAction(id)
    : null;

  const calendarCheckins =
    calendarResult?.success === true ? calendarResult.checkins : [];

  const calendarParticipants =
    calendarResult?.success === true ? calendarResult.participants : [];

  // Participant list (creator gets "Remove" buttons inside the component)
  const membersResult = canViewTasks
    ? await getChallengeMembersAction(id)
    : null;

  const members = membersResult?.success === true ? membersResult.members : [];

  /* ---------------------------------------------------------------------- */
  /* 8. Membership controls                                                 */
  /* ---------------------------------------------------------------------- */

  /**
   * Public challenges:
   * - Active
   * - Not creator
   * - Not already joined
   *
   * Private challenges:
   * - Membership is granted by accepting an invitation.
   * - No public Join button.
   */

  const canJoin =
    isPublic &&
    challenge.status === "active" &&
    !isCreator &&
    !isJoined;

  const showMembershipButton = isPublic && !isCreator;

  const isActive = challenge.status === "active";

  /* ---------------------------------------------------------------------- */
  /* 9. Render                                                              */
  /* ---------------------------------------------------------------------- */

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
      {/* Challenge overview */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Challenge information */}
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

            {/* Actions */}
            <div className="flex shrink-0 flex-wrap items-center gap-3">
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
                <>
                  <span className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium">
                    Challenge creator
                  </span>

                  <ChallengeManagementDrawer
                    challenge={challengeForDrawer}
                  >
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

                    <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                      <div>
                        <h3 className="font-semibold text-destructive">
                          Danger zone
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Deleting this challenge removes its tasks and
                          check-ins for everyone.
                        </p>
                      </div>

                      <DeleteChallengeButton challengeId={id} />
                    </div>
                  </ChallengeManagementDrawer>
                </>
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
          className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6"
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
        <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">
            Join this challenge to track your progress
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Become a participant to see the shared calendar and record your
            daily progress alongside everyone else.
          </p>

          {/* Only public challenges can be joined directly */}
          {canJoin && (
            <div className="mt-5 flex justify-center">
              <ChallengeMembershipButton
                challengeId={id}
                initialIsJoined={false}
                initialParticipantCount={participantCount}
              />
            </div>
          )}
        </section>
      )}

      {/* Participants (creator and members only) */}
      {canViewTasks && members.length > 0 && (
        <section
          aria-label="Participants"
          className="rounded-2xl border border-border bg-card p-4 sm:p-6"
        >
          <ChallengeMembersList
            challengeId={id}
            members={members}
            creatorId={challenge.creatorId}
            currentUserId={userId}
          />
        </section>
      )}
    </main>
  );
}