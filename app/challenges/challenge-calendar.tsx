
"use client";

import { useMemo, useState } from "react";
import {
  createCheckinAction,
  deleteCheckinAction,
} from "@/actions/checkin.action";

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

  const selectedTasks = selectedDate
    ? tasks.filter((task) => isTaskScheduled(task, selectedDate))
    : [];

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

        // The server action persists the check-in.
        // Refreshing the page will retrieve its complete database record.
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

    if (scheduledTasks.length === 0) {
      return null;
    }

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
      return "bg-[#399F7A] text-white border-[#399F7A]";
    }

    if (progress > 0) {
      return "bg-[#284F3F] text-[#A8E2C8] border-[#477C63]";
    }

    return "bg-[#202A24] text-[#829087] border-[#354139]";
  }

  return (
    <section className="space-y-5 rounded-2xl border border-[#303B34] bg-[#111713] p-5 text-[#F1F5F2] md:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B9B91]">
            Daily tracking
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Challenge calendar
          </h2>

          <p className="mt-1 text-sm text-[#A3B2A8]">
            Track your progress together, one day at a time.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-[#A3B2A8]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#399F7A]" />
            Completed
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#284F3F]" />
            In progress
          </span>
        </div>
      </div>

      {/* Participant calendar */}
      <div className="overflow-x-auto rounded-xl border border-[#303B34]">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#19211D]">
              <th className="sticky left-0 z-20 min-w-48 border-b border-[#303B34] bg-[#19211D] p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#9EADA3]">
                Participant
              </th>

              {dates.map((date) => {
                const formatted = formatDate(date);

                return (
                  <th
                    key={date}
                    className="min-w-[68px] border-b border-l border-[#303B34] px-2 py-3 text-center"
                  >
                    <div className="text-xs font-medium text-[#9EADA3]">
                      {formatted.weekday}
                    </div>

                    <div className="mt-1 text-base font-semibold text-[#F1F5F2]">
                      {formatted.day}
                    </div>

                    <div className="text-[10px] text-[#8B9B91]">
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
                  className="border-b border-[#303B34] last:border-0 hover:bg-[#202A24]/40"
                >
                  <td className="sticky left-0 z-10 min-w-48 border-r border-[#303B34] bg-[#19211D] p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          isCurrentUser
                            ? "bg-[#285B46] text-[#B7E8D0]"
                            : "bg-[#263A4B] text-[#A9C9E8]"
                        }`}
                      >
                        {participant.participantUsername
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#E4EBE6]">
                          {participant.participantUsername}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-xs text-[#80C7A5]">
                              You
                            </span>
                          )}
                        </p>

                        <p className="text-[11px] text-[#829087]">
                          {isCurrentUser ? "Your progress" : "Participant"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {dates.map((date) => {
                    const progress = getProgress(
                      participant.participantId,
                      date,
                    );

                    const isToday = date === getLocalDate("UTC");
                    const isPastOrToday =
                      date <= getLocalDate("UTC");

                    const canOpen =
                      isCurrentUser &&
                      isJoined &&
                      isPastOrToday &&
                      progress !== null;

                    return (
                      <td
                        key={`${participant.membershipId}-${date}`}
                        className={`border-l border-[#303B34] p-2 text-center ${
                          isToday ? "bg-amber-400/[0.04]" : ""
                        }`}
                      >
                        {progress === null ? (
                          <span className="text-[#46534B]">–</span>
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
                            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                              getProgressColor(progress)
                            } ${
                              canOpen
                                ? "cursor-pointer hover:brightness-125"
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
                  className="p-12 text-center text-sm text-[#8B9B91]"
                >
                  No participants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#8B9B91]">
        Select your progress percentage to view and update your scheduled tasks.
        Other participants' progress is visible but read-only.
      </p>

      {/* Check-in modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
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
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#35443A] bg-[#151D18] shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[#303B34] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#80C7A5]">
                  Daily check-in
                </p>

                <h3
                  id="checkin-title"
                  className="mt-1 text-xl font-semibold text-[#F1F5F2]"
                >
                  Your tasks
                </h3>

                <p className="mt-1 text-sm text-[#9EADA3]">
                  {formatDate(selectedDate).weekday},{" "}
                  {formatDate(selectedDate).day}{" "}
                  {formatDate(selectedDate).month}
                </p>
              </div>

              <button
                type="button"
                disabled={Boolean(savingTaskId)}
                onClick={() => setSelectedDate(null)}
                className="rounded-lg p-2 text-[#9EADA3] transition hover:bg-[#26332B] hover:text-white"
                aria-label="Close check-in"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
              {selectedTasks.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#9EADA3]">
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
                      onClick={() =>
                        toggleTask(task.id, selectedDate)
                      }
                      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                        completed
                          ? "border-[#399F7A]/60 bg-[#214535]/40"
                          : "border-[#354139] bg-[#1C2620] hover:border-[#557263]"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm ${
                          completed
                            ? "border-[#399F7A] bg-[#399F7A] text-white"
                            : "border-[#617168] text-transparent"
                        }`}
                      >
                        {isSaving ? "…" : "✓"}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block font-medium ${
                            completed
                              ? "text-[#B7E8D0]"
                              : "text-[#E4EBE6]"
                          }`}
                        >
                          {task.title}
                        </span>

                        {task.description && (
                          <span className="mt-1 block text-xs text-[#8B9B91]">
                            {task.description}
                          </span>
                        )}
                      </span>

                      {completed && (
                        <span className="text-xs font-medium text-[#80C7A5]">
                          Done
                        </span>
                      )}
                    </button>
                  );
                })
              )}

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}
            </div>

            <div className="border-t border-[#303B34] p-5">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-[#9EADA3]">Daily completion</span>

                <span className="font-semibold text-[#80C7A5]">
                  {selectedTasks.length > 0
                    ? Math.round(
                        (selectedTasks.filter((task) =>
                          completedTaskIds.has(task.id),
                        ).length /
                          selectedTasks.length) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#29342D]">
                <div
                  className="h-full rounded-full bg-[#399F7A] transition-all duration-300"
                  style={{
                    width: `${
                      selectedTasks.length > 0
                        ? (selectedTasks.filter((task) =>
                            completedTaskIds.has(task.id),
                          ).length /
                            selectedTasks.length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
