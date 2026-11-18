
"use client";

import { useEffect, useState, useTransition } from "react";

import { createChallengeScheduleAction } from "@/actions/checkin.action";

type Props = {
  challengeId: string;
  taskId: string;
  initialFrequency?: "daily" | "selected_days";
  initialWeekdays?: number[];
  initialTimezone?: string;
};

const weekdays = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export function ChallengeScheduleForm({
  challengeId,
  taskId,
  initialFrequency = "daily",
  initialWeekdays = [],
  initialTimezone = "UTC",
}: Props) {
  const [frequency, setFrequency] = useState<
    "daily" | "selected_days"
  >(initialFrequency);

  const [selectedDays, setSelectedDays] =
    useState<number[]>(initialWeekdays);

  const [timezone, setTimezone] = useState(initialTimezone);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialTimezone === "UTC") {
      const browserTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (browserTimezone) {
        setTimezone(browserTimezone);
      }
    }
  }, [initialTimezone]);

  function toggleDay(day: number) {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day]
    );
  }

  function handleSubmit() {
    setError("");
    setSuccess("");

    if (
      frequency === "selected_days" &&
      selectedDays.length === 0
    ) {
      setError("Select at least one weekday.");
      return;
    }

    startTransition(async () => {
      const result = await createChallengeScheduleAction({
        challengeId,
        taskId,
        frequency,
        weekdays:
          frequency === "daily" ? [] : selectedDays,
        timezone,
      });

      if (!result.success) {
        setError(result.error ?? "Unable to save schedule.");
        return;
      }

      setSuccess("Schedule saved successfully.");
    });
  }

  return (
    <div className="mt-4 space-y-4 rounded-lg border p-4">
      <h4 className="font-semibold">Task schedule</h4>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Frequency
        </label>

        <select
          value={frequency}
          onChange={(event) =>
            setFrequency(
              event.target.value as
                | "daily"
                | "selected_days"
            )
          }
          className="w-full rounded-md border p-2"
        >
          <option value="daily">Every day</option>
          <option value="selected_days">
            Selected weekdays
          </option>
        </select>
      </div>

      {frequency === "selected_days" && (
        <div>
          <p className="mb-2 text-sm font-medium">
            Select weekdays
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {weekdays.map((day) => (
              <label
                key={day.value}
                className="flex items-center gap-2 rounded-md border p-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedDays.includes(day.value)}
                  onChange={() => toggleDay(day.value)}
                />

                {day.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium">
          Timezone
        </label>

        <input
          type="text"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          placeholder="Africa/Tunis"
          className="w-full rounded-md border p-2"
        />

        <p className="mt-1 text-xs text-gray-500">
          The schedule uses this timezone to determine calendar days.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save schedule"}
      </button>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-600">{success}</p>
      )}
    </div>
  );
}
