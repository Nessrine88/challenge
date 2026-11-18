"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChallengeTaskAction } from "@/actions/challenge.action";

type Props = {
  challengeId: string;
};

type Frequency = "daily" | "selected_days";

// JavaScript weekday numbers (0 = Sunday), shown Monday first.
const WEEKDAYS = [
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
  { value: 0, short: "Sun", label: "Sunday" },
];

const inputClass =
  "mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";

export function CreateTaskForm({ challengeId }: Props) {
  const router = useRouter();
  const uid = useId();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [days, setDays] = useState<number[]>([]);
  const [timezone, setTimezone] = useState("UTC");

  // Start in the visitor's own timezone.
  useEffect(() => {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTimezone) setTimezone(browserTimezone);
  }, []);

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (frequency === "selected_days" && days.length === 0) {
      setError("Select at least one weekday.");
      return;
    }

    startTransition(async () => {
      const result = await createChallengeTaskAction({
        challengeId,
        title,
        description,
        frequency,
        weekdays: frequency === "daily" ? [] : days,
        timezone: timezone.trim(),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setTitle("");
      setDescription("");
      setSuccess("Task added.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor={`${uid}-title`} className="block text-sm font-medium">
          Task title
        </label>
        <input
          id={`${uid}-title`}
          required
          minLength={3}
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={inputClass}
          placeholder="Example: Learn 10 German words"
        />
      </div>

      <div>
        <label
          htmlFor={`${uid}-description`}
          className="block text-sm font-medium"
        >
          Instructions <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id={`${uid}-description`}
          maxLength={2000}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={inputClass}
          placeholder="Describe what participants should do."
        />
      </div>

      <fieldset className="space-y-4 rounded-xl border border-border bg-secondary/20 p-4">
        <legend className="px-1 text-sm font-semibold">Schedule</legend>

        <div>
          <label
            htmlFor={`${uid}-frequency`}
            className="block text-sm font-medium"
          >
            Repeats
          </label>
          <select
            id={`${uid}-frequency`}
            value={frequency}
            onChange={(event) => setFrequency(event.target.value as Frequency)}
            className={inputClass}
          >
            <option value="daily">Every day</option>
            <option value="selected_days">Selected weekdays</option>
          </select>
        </div>

        {frequency === "selected_days" && (
          <div>
            <p className="text-sm font-medium">On these days</p>
            <div
              role="group"
              aria-label="Weekdays"
              className="mt-2 flex flex-wrap gap-2"
            >
              {WEEKDAYS.map((day) => {
                const on = days.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    aria-pressed={on}
                    aria-label={day.label}
                    onClick={() => toggleDay(day.value)}
                    className={
                      on
                        ? "h-9 min-w-12 rounded-lg border border-primary bg-primary px-3 text-sm font-medium text-primary-foreground"
                        : "h-9 min-w-12 rounded-lg border border-border bg-background px-3 text-sm font-medium text-muted-foreground hover:bg-secondary"
                    }
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor={`${uid}-timezone`}
            className="block text-sm font-medium"
          >
            Timezone
          </label>
          <input
            id={`${uid}-timezone`}
            required
            maxLength={64}
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className={inputClass}
            placeholder="Africa/Tunis"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Decides where each calendar day starts and ends.
          </p>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Adding..." : "Add task"}
      </button>
    </form>
  );
}