
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
  const fallbackEndDate = getLocalDate("UTC");
  const dates = getDates(
    startDate,
    endDate ?? fallbackEndDate,
  );

  return (
    <section className="mt-8 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Challenge calendar</h2>
        <p className="text-sm text-muted-foreground">
          Track daily task completion with other participants.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-20 min-w-48 bg-background p-3 text-left">
                Task
              </th>

              {dates.map((date) => {
                const formatted = formatDate(date);

                return (
                  <th
                    key={date}
                    className="min-w-16 border-l border-border px-2 py-3 text-center"
                  >
                    <div className="text-xs text-muted-foreground">
                      {formatted.weekday}
                    </div>
                    <div className="font-semibold">{formatted.day}</div>
                    <div className="text-xs text-muted-foreground">
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
                  className="border-b border-border last:border-0"
                >
                  <td className="sticky left-0 z-10 min-w-48 bg-background p-3">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {task.description}
                      </p>
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

                    return (
                      <td
                        key={`${task.id}-${date}`}
                        className="border-l border-border p-2 text-center"
                      >
                        {isScheduled && date <= today ? (
                          <div className="flex min-w-10 flex-col items-center gap-1">
                            {canCheckIn ? (
                              <ChallengeCheckinButton
                                taskId={task.id}
                                checkinDate={date}
                                initialCompleted={currentUserCheckin}
                              />
                            ) : (
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-md border ${
                                  currentUserCheckin
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-border"
                                }`}
                              >
                                {currentUserCheckin ? "✓" : ""}
                              </div>
                            )}

                            <div className="flex flex-wrap justify-center gap-1">
                              {otherParticipants.map((participant) => (
                                <span
                                  key={participant.id}
                                  title={participant.participantUsername}
                                  className="h-1.5 w-1.5 rounded-full bg-blue-500"
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="h-8 w-8" />
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
                  className="p-8 text-center text-muted-foreground"
                >
                  No tasks have been added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Green checkmarks show your completed tasks. Blue dots represent other
        participants who completed the same task.
      </p>
    </section>
  );
}
