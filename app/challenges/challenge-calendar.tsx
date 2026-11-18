
"use client";

import { ChallengeCheckinButton } from "./challenge-checkin-button";

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
  participantId: string;
  participantUsername: string;
  taskId: string;
  checkinDate: string;
};

type Props = {
  tasks: CalendarTask[];
  checkins: CalendarCheckin[];
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

export function ChallengeCalendar({
  tasks,
  checkins,
  startDate,
  endDate,
  currentUserId,
  isJoined,
}: Props) {
  const dates = getDates(
    startDate,
    endDate ?? getLocalDate("UTC"),
  );

  return (
    <section className="space-y-5 rounded-2xl border border-[#303B34] bg-[#111713] p-5 text-[#F1F5F2] md:p-7">
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
            Your completion
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            Other participants
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#303B34]">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#19211D]">
              <th className="sticky left-0 z-20 min-w-52 border-b border-[#303B34] bg-[#19211D] p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#9EADA3]">
                Task
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
            {tasks.map((task) => {
              const timezone = task.schedule?.timezone ?? "UTC";
              const today = getLocalDate(timezone);

              return (
                <tr
                  key={task.id}
                  className="border-b border-[#303B34] last:border-0 hover:bg-[#202A24]/50"
                >
                  <td className="sticky left-0 z-10 min-w-52 border-r border-[#303B34] bg-[#19211D] p-4">
                    <p className="font-medium text-[#E4EBE6]">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-1 max-w-48 text-xs text-[#8B9B91]">
                        {task.description}
                      </p>
                    )}
                    {!task.schedule && (
                      <span className="mt-2 inline-block text-[10px] text-amber-400">
                        Schedule not configured
                      </span>
                    )}
                  </td>

                  {dates.map((date) => {
                    const weekday = new Date(
                      `${date}T12:00:00.000Z`,
                    ).getUTCDay();

                    const isScheduled =
                      task.schedule?.frequency === "daily" ||
                      (task.schedule?.frequency === "selected_days" &&
                        task.schedule.weekdays.includes(weekday));

                    const currentUserCheckin = checkins.some(
                      (checkin) =>
                        checkin.taskId === task.id &&
                        checkin.checkinDate === date &&
                        checkin.participantId === currentUserId,
                    );

                    const otherParticipants = checkins.filter(
                      (checkin) =>
                        checkin.taskId === task.id &&
                        checkin.checkinDate === date &&
                        checkin.participantId !== currentUserId,
                    );

                    const canCheckIn =
                      isJoined &&
                      isScheduled &&
                      date <= today &&
                      Boolean(task.schedule);

                    const isToday = date === today;

                    return (
                      <td
                        key={`${task.id}-${date}`}
                        className={`border-l border-[#303B34] p-2 text-center ${
                          isToday ? "bg-amber-400/[0.04]" : ""
                        }`}
                      >
                        {isScheduled && date <= today ? (
                          <div className="flex min-w-10 flex-col items-center gap-1.5">
                            {canCheckIn ? (
                              <div className="flex items-center justify-center">
                                <ChallengeCheckinButton
                                  taskId={task.id}
                                  checkinDate={date}
                                  initialCompleted={currentUserCheckin}
                                />
                              </div>
                            ) : (
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm ${
                                  currentUserCheckin
                                    ? "border-[#399F7A] bg-[#399F7A] text-white"
                                    : "border-[#354139] bg-[#202A24] text-[#65756B]"
                                }`}
                              >
                                {currentUserCheckin ? "✓" : "–"}
                              </div>
                            )}

                            <div className="flex flex-wrap justify-center gap-1">
                              {otherParticipants.map((participant) => (
                                <span
                                  key={participant.id}
                                  title={participant.participantUsername}
                                  className="h-1.5 w-1.5 rounded-full bg-blue-400"
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-[#46534B]">
                            {isScheduled ? "·" : ""}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {tasks.length === 0 && (
              <tr>
                <td
                  colSpan={dates.length + 1}
                  className="p-12 text-center text-sm text-[#8B9B91]"
                >
                  No tasks have been added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[#8B9B91]">
        Select an available cell to record your completion. Future dates
        cannot be checked in.
      </p>
    </section>
  );
}
