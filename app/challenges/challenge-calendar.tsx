"use client";

import { useMemo, useState } from "react";
import {
  createCheckinAction,
  deleteCheckinAction,
} from "@/actions/checkin.action";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";

type CalendarTask = {
  id: string;
  title: string;
  description: string | null;
  schedule: {
    id: string;
    frequency: "daily" | "selected_days";
    weekdays: number[];
    timezone: string;
  } | null;
};

type CalendarCheckin = {
  id: string;
  membershipId: string;
  participantId: string;
  participantUsername: string;
  taskId: string;
  taskTitle: string;
  checkinDate: string;
  note: string | null;
  createdAt: Date;
};

type CalendarParticipant = {
  membershipId: string;
  participantId: string;
  participantUsername: string;
};

type Props = {
  tasks: CalendarTask[];
  checkins: CalendarCheckin[];
  participants: CalendarParticipant[];
  startDate: string;
  endDate: string | null;
  currentUserId: string;
  isJoined: boolean;
};

function getLocalDate(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function getDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  const current = new Date(`${startDate}T12:00:00.000Z`);
  const end = new Date(`${endDate}T12:00:00.000Z`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T12:00:00.000Z`);

  return {
    weekday: new Intl.DateTimeFormat("en", {
      weekday: "short",
      timeZone: "UTC",
    }).format(parsed),
    day: new Intl.DateTimeFormat("en", {
      day: "numeric",
      timeZone: "UTC",
    }).format(parsed),
    month: new Intl.DateTimeFormat("en", {
      month: "short",
      timeZone: "UTC",
    }).format(parsed),
  };
}

function isTaskScheduled(task: CalendarTask, date: string) {
  if (!task.schedule) return false;

  if (task.schedule.frequency === "daily") {
    return true;
  }

  const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay();

  return task.schedule.weekdays.includes(weekday);
}

export function ChallengeCalendar({
  tasks,
  checkins: initialCheckins,
  participants,
  startDate,
  endDate,
  currentUserId,
  isJoined,
}: Props) {
  const [checkins, setCheckins] = useState(initialCheckins);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dates = useMemo(
    () => getDates(startDate, endDate ?? getLocalDate("UTC")),
    [startDate, endDate],
  );

  const selectedTasks = tasks;

  const completedTaskIds = new Set(
    checkins
      .filter(
        (checkin) =>
          checkin.participantId === currentUserId &&
          checkin.checkinDate === selectedDate,
      )
      .map((checkin) => checkin.taskId),
  );

  async function toggleTask(taskId: string, date: string) {
    if (savingTaskId) return;

    setError(null);
    setSavingTaskId(taskId);

    const alreadyCompleted = checkins.some(
      (checkin) =>
        checkin.participantId === currentUserId &&
        checkin.taskId === taskId &&
        checkin.checkinDate === date,
    );

    try {
      if (alreadyCompleted) {
        const result = await deleteCheckinAction({
          taskId,
          checkinDate: date,
        });

        if (!result.success) {
          setError(result.error || "Unable to update your progress.");
          return;
        }

        setCheckins((previous) =>
          previous.filter(
            (checkin) =>
              !(
                checkin.participantId === currentUserId &&
                checkin.taskId === taskId &&
                checkin.checkinDate === date
              ),
          ),
        );
      } else {
        const result = await createCheckinAction({
          taskId,
          checkinDate: date,
        });

        if (!result.success) {
          setError(result.error || "Unable to update your progress.");
          return;
        }

        setCheckins((previous) => [
          ...previous,
          {
            id: `temporary-${taskId}-${date}`,
            membershipId:
              participants.find(
                (participant) =>
                  participant.participantId === currentUserId,
              )?.membershipId ?? "",
            participantId: currentUserId,
            participantUsername: "You",
            taskId,
            taskTitle:
              tasks.find((task) => task.id === taskId)?.title ?? "",
            checkinDate: date,
            note: null,
            createdAt: new Date(),
          },
        ]);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSavingTaskId(null);
    }
  }

  function getProgress(participantId: string, date: string) {
    const scheduledTasks = tasks.filter((task) =>
      isTaskScheduled(task, date),
    );

    if (scheduledTasks.length === 0) return null;

    const completedCount = scheduledTasks.filter((task) =>
      checkins.some(
        (checkin) =>
          checkin.participantId === participantId &&
          checkin.taskId === task.id &&
          checkin.checkinDate === date,
      ),
    ).length;

    return Math.round(
      (completedCount / scheduledTasks.length) * 100,
    );
  }

  function getProgressColor(progress: number) {
    if (progress === 100) {
      return "border-emerald-500 bg-emerald-500 text-white";
    }

    if (progress > 0) {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    }

    return "border-border bg-secondary/50 text-muted-foreground";
  }

  const dailyCompletion =
    selectedTasks.length > 0
      ? Math.round(
          (selectedTasks.filter((task) =>
            completedTaskIds.has(task.id),
          ).length /
            selectedTasks.length) *
            100,
        )
      : 0;

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-4 text-foreground sm:p-5 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="size-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Challenge calendar
            </h2>
            <p className="text-xs text-muted-foreground">
              Daily participant progress
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500" />
            Completed
          </span>

          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border border-emerald-500/40 bg-emerald-500/10" />
            In progress
          </span>

          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border border-border bg-secondary" />
            Not started
          </span>
        </div>
      </div>

      {/* Calendar table */}
     {/* Calendar table */}
<div className="overflow-x-auto rounded-xl border border-border">
  {/* Desktop / Tablet: Participants as rows, dates as columns */}
  <div className="hidden sm:block overflow-x-auto">
    <table className="w-max min-w-full border-collapse text-sm">
      <thead>
        <tr className="bg-muted/50">
          <th className="sticky left-0 z-20 min-w-44 border-b border-border bg-muted/80 px-3 py-3 text-left text-xs font-medium text-muted-foreground backdrop-blur sm:min-w-52 sm:px-4">
            Participant
          </th>

          {dates.map((date) => {
            const formatted = formatDate(date);
            const isToday = date === getLocalDate("UTC");

            return (
              <th
                key={date}
                className={`min-w-[62px] border-b border-l border-border px-2 py-2.5 text-center ${
                  isToday ? "bg-primary/5" : ""
                }`}
              >
                <div
                  className={`text-[11px] font-medium ${
                    isToday ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {formatted.weekday}
                </div>

                <div
                  className={`mt-0.5 text-base font-semibold ${
                    isToday ? "text-primary" : "text-foreground"
                  }`}
                >
                  {formatted.day}
                </div>

                <div className="text-[10px] text-muted-foreground">
                  {formatted.month}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {participants.map((participant) => {
          const isCurrentUser =
            participant.participantId === currentUserId;

          return (
            <tr
              key={participant.membershipId}
              className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
            >
              {/* Participant */}
              <td className="sticky left-0 z-10 min-w-44 border-r border-border bg-card px-3 py-3 sm:min-w-52 sm:px-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isCurrentUser
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {participant.participantUsername
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {participant.participantUsername}
                      {isCurrentUser && (
                        <span className="ml-1.5 text-xs text-primary">
                          (You)
                        </span>
                      )}
                    </p>

                    <p className="text-[11px] text-muted-foreground">
                      {isCurrentUser ? "Your progress" : "Participant"}
                    </p>
                  </div>
                </div>
              </td>

              {/* Progress cells */}
              {dates.map((date) => {
                const progress = getProgress(
                  participant.participantId,
                  date,
                );

                const isToday = date === getLocalDate("UTC");
                const isPastOrToday = date <= getLocalDate("UTC");

                const canOpen =
                  isCurrentUser &&
                  isJoined &&
                  isPastOrToday &&
                  progress !== null;

                return (
                  <td
                    key={`${participant.membershipId}-${date}`}
                    className={`border-l border-border p-1.5 text-center sm:p-2 ${
                      isToday ? "bg-primary/[0.03]" : ""
                    }`}
                  >
                    {progress === null ? (
                      <span className="text-muted-foreground/30">—</span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canOpen}
                        onClick={() => {
                          if (canOpen) {
                            setSelectedDate(date);
                            setError(null);
                          }
                        }}
                        title={
                          canOpen
                            ? "View and update your tasks"
                            : `${progress}% completed`
                        }
                        className={`mx-auto flex size-9 items-center justify-center rounded-lg border text-[11px] font-semibold transition-all sm:size-10 ${getProgressColor(
                          progress,
                        )} ${
                          canOpen
                            ? "cursor-pointer hover:scale-105 hover:shadow-sm"
                            : "cursor-default"
                        }`}
                      >
                        {progress}%
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}

        {participants.length === 0 && (
          <tr>
            <td
              colSpan={dates.length + 1}
              className="px-6 py-12 text-center"
            >
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
                <CalendarDays className="size-5 text-muted-foreground" />
              </div>

              <p className="mt-3 text-sm font-medium">
                No participants yet
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Participants will appear here once they join.
              </p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Mobile: Dates as rows, participants as column headers */}
  <div className="sm:hidden overflow-x-auto">
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-muted/50">
          {/* Sticky date header */}
          <th className="sticky left-0 z-20 min-w-[76px] border-b border-r border-border bg-muted px-2 py-3 text-left font-medium text-muted-foreground">
            Date
          </th>

          {participants.map((participant) => {
            const isCurrentUser =
              participant.participantId === currentUserId;

            return (
              <th
                key={participant.membershipId}
                className="min-w-[76px] border-b border-border px-2 py-3 text-center"
              >
                <div
                  className={`mx-auto flex size-8 items-center justify-center rounded-full text-[10px] font-semibold ${
                    isCurrentUser
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {participant.participantUsername
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <p
                  className={`mt-1.5 max-w-[70px] truncate text-[11px] ${
                    isCurrentUser
                      ? "font-semibold text-primary"
                      : "font-medium text-foreground"
                  }`}
                >
                  {participant.participantUsername}
                </p>

                {isCurrentUser && (
                  <span className="text-[9px] text-muted-foreground">
                    You
                  </span>
                )}
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {dates.map((date) => {
          const formatted = formatDate(date);
          const isToday = date === getLocalDate("UTC");
          const isPastOrToday = date <= getLocalDate("UTC");

          return (
            <tr
              key={date}
              className="border-b border-border last:border-0"
            >
              {/* Date on the left */}
              <td
                className={`sticky left-0 z-10 min-w-[76px] border-r border-border px-2 py-2.5 ${
                  isToday ? "bg-primary/5" : "bg-card"
                }`}
              >
                <div
                  className={`text-[10px] ${
                    isToday
                      ? "font-medium text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatted.weekday}
                </div>

                <div
                  className={`text-sm font-semibold ${
                    isToday ? "text-primary" : "text-foreground"
                  }`}
                >
                  {formatted.day} {formatted.month}
                </div>

                {isToday && (
                  <span className="text-[9px] font-medium text-primary">
                    Today
                  </span>
                )}
              </td>

              {/* Each participant's progress for this date */}
              {participants.map((participant) => {
                const isCurrentUser =
                  participant.participantId === currentUserId;

                const progress = getProgress(
                  participant.participantId,
                  date,
                );

                const canOpen =
                  isCurrentUser &&
                  isJoined &&
                  isPastOrToday &&
                  progress !== null;

                return (
                  <td
                    key={`${participant.membershipId}-${date}`}
                    className={`border-l border-border px-2 py-2 text-center ${
                      isToday ? "bg-primary/[0.03]" : ""
                    }`}
                  >
                    {progress === null ? (
                      <span className="text-muted-foreground/30">—</span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canOpen}
                        onClick={() => {
                          if (canOpen) {
                            setSelectedDate(date);
                            setError(null);
                          }
                        }}
                        title={
                          canOpen
                            ? "View and update your tasks"
                            : `${participant.participantUsername}: ${progress}%`
                        }
                        className={`mx-auto flex size-9 items-center justify-center rounded-lg border text-[10px] font-semibold transition-all ${getProgressColor(
                          progress,
                        )} ${
                          canOpen
                            ? "cursor-pointer active:scale-95"
                            : "cursor-default"
                        }`}
                      >
                        {progress}%
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}

        {/* Empty participants */}
        {participants.length === 0 && (
          <tr>
            <td
              colSpan={1}
              className="px-4 py-10 text-center"
            >
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
                <CalendarDays className="size-5 text-muted-foreground" />
              </div>

              <p className="mt-3 text-sm font-medium">
                No participants yet
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Participants will appear here once they join.
              </p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Select your progress to update your tasks. Other participants&apos;
        progress is visible but read-only.
      </p>

      {/* Check-in modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingTaskId) {
              setSelectedDate(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkin-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-border p-4 sm:p-5">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <CalendarDays className="size-4" />
                  <p className="text-xs font-medium">Daily check-in</p>
                </div>

                <h3
                  id="checkin-title"
                  className="mt-1 text-lg font-semibold"
                >
                  Your tasks
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(selectedDate).weekday},{" "}
                  {formatDate(selectedDate).day}{" "}
                  {formatDate(selectedDate).month}
                </p>
              </div>

              <button
                type="button"
                disabled={Boolean(savingTaskId)}
                onClick={() => setSelectedDate(null)}
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                aria-label="Close check-in"
                title="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Tasks */}
            <div className="max-h-[60vh] space-y-2.5 overflow-y-auto p-4 sm:p-5">
              {selectedTasks.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No tasks are scheduled for this day.
                </p>
              ) : (
                selectedTasks.map((task) => {
                  const completed = completedTaskIds.has(task.id);
                  const isSaving = savingTaskId === task.id;

                  return (
                    <button
                      key={task.id}
                      type="button"
                      disabled={Boolean(savingTaskId)}
                      onClick={() => toggleTask(task.id, selectedDate)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all sm:p-4 ${
                        completed
                          ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                          : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      {/* Checkbox */}
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          completed
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-border bg-background text-transparent"
                        }`}
                      >
                        {isSaving ? (
                          <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                      </span>

                      {/* Task info */}
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm font-medium ${
                            completed
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </span>

                        {task.description && (
                          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                            {task.description}
                          </span>
                        )}
                      </span>

                      {/* Status */}
                      {completed && (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          <span className="hidden sm:inline">Done</span>
                        </span>
                      )}
                    </button>
                  );
                })
              )}

              {/* Error notification — preserved */}
              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
            </div>

            {/* Progress footer */}
            <div className="border-t border-border bg-muted/20 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Daily completion
                </span>

                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {dailyCompletion}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${dailyCompletion}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {selectedTasks.filter((task) =>
                    completedTaskIds.has(task.id),
                  ).length}{" "}
                  of {selectedTasks.length} tasks
                </span>

                {dailyCompletion === 100 && selectedTasks.length > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                    All completed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}