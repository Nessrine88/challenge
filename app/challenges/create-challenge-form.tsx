"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import type { Challenge } from "./challenge-form.types";

import {
  createChallengeAction,
  updateChallengeAction,
} from "@/actions/challenge.action";

type Task = {
  id?: string;
  title: string;
  description: string;
  frequency: "daily" | "selected_days";
  weekdays: number[];
  timezone: string;
};

type Props =
  | {
      mode: "create";
      challenge?: never;
    }
  | {
      mode: "update";
      challenge: Challenge;
    };

const getDefaultTask = (): Task => ({
  title: "",
  description: "",
  frequency: "daily",
  weekdays: [1, 2, 3, 4, 5],
  timezone:
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      : "UTC",
});

export function CreateChallengeForm({ mode, challenge }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(challenge?.title ?? "");

  const [description, setDescription] = useState(
    challenge?.description ?? "",
  );

  const [category, setCategory] = useState(
    challenge?.category ?? "",
  );

  const [visibility, setVisibility] = useState<"public" | "private">(
    challenge?.visibility ?? "public",
  );

  const [startDate, setStartDate] = useState(
    challenge?.startDate ?? "",
  );

  const [endDate, setEndDate] = useState(
    challenge?.endDate ?? "",
  );

  const [tasks, setTasks] = useState<Task[]>(
    challenge?.tasks?.length
      ? challenge.tasks.map((task) => ({
          ...task,
          description: task.description ?? "",
        }))
      : mode === "create"
        ? [getDefaultTask()]
        : [],
  );

  const addTask = () => {
    if (mode !== "create") return;
    
    // Inherit the schedule settings from the first task (if available)
    const primaryTask = tasks[0];
    const newSchedule = primaryTask
      ? {
          frequency: primaryTask.frequency,
          weekdays: [...primaryTask.weekdays],
          timezone: primaryTask.timezone,
        }
      : getDefaultTask();

    setTasks((previous) => [
      ...previous,
      {
        title: "",
        description: "",
        frequency: newSchedule.frequency,
        weekdays: newSchedule.weekdays,
        timezone: newSchedule.timezone,
      },
    ]);
  };

  const removeTask = (index: number) => {
    if (mode !== "create") return;
    setTasks((previous) => previous.filter((_, i) => i !== index));
  };

  const updateTask = (
    index: number,
    field: keyof Task,
    value: string | number[],
  ) => {
    setTasks((previous) =>
      previous.map((task, i) =>
        i === index ? { ...task, [field]: value } : task,
      ),
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError("Challenge title must contain at least 3 characters.");
      return;
    }

    if (!startDate) {
      setError("Please select a start date.");
      return;
    }

    if (endDate && endDate < startDate) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    if (mode === "create") {
      if (tasks.length === 0) {
        setError("A challenge must have at least one task.");
        return;
      }

      for (const [index, task] of tasks.entries()) {
        if (!task.title.trim()) {
          setError(`Please enter a title for task ${index + 1}.`);
          return;
        }

        if (
          task.frequency === "selected_days" &&
          task.weekdays.length === 0
        ) {
          setError(
            `Please select at least one weekday for task ${index + 1}.`,
          );
          return;
        }
      }
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || undefined,
        visibility,
        startDate,
        endDate: endDate || undefined,
        ...(mode === "create"
          ? {
              tasks: tasks.map((task) => ({
                ...task,
                title: task.title.trim(),
                description: task.description.trim(),
              })),
            }
          : {}),
      };

      if (mode === "create") {
        const res = await createChallengeAction(payload);

        if (!res.success) {
          setError(res.error ?? "Unable to create the challenge.");
          return;
        }

        if (!res.challenge?.id) {
          setError(
            "The challenge was created, but no ID was returned.",
          );
          return;
        }

        router.push(`/challenges/${res.challenge.id}`);
        router.refresh();
        return;
      }

      const res = await updateChallengeAction({
        challengeId: challenge.id,
        ...payload,
      });

      if (!res.success) {
        setError(res.error ?? "Unable to update the challenge.");
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("Challenge form submission failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const weekdays = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Challenge information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">
            Challenge Title
          </label>

          <input
            required
            minLength={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="e.g., 30 Days of Coding"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Description
          </label>

          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Describe the challenge goals..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">
              Category
            </label>

            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Fitness, Tech..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Visibility
            </label>

            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(
                  e.target.value as "public" | "private",
                )
              }
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">
              Start Date
            </label>

            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              End Date (Optional)
            </label>

            <input
              type="date"
              min={startDate || undefined}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tasks Section - ONLY rendered when mode is "create" */}
      {mode === "create" && (
        <>
          <hr className="border-border" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Initial Tasks</h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Define the tasks participants will complete.
                </p>
              </div>

              <button
                type="button"
                onClick={addTask}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-secondary/80"
              >
                <Plus className="size-4" />
                Add Task
              </button>
            </div>

            {tasks.length === 0 && (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No tasks are currently available.
              </p>
            )}

            {tasks.map((task, index) => (
              <div
                key={task.id ?? `new-${index}`}
                className="space-y-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Task #{index + 1}
                  </span>

                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      className="text-destructive hover:opacity-80"
                      aria-label={`Remove task ${index + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium">
                    Task Title
                  </label>

                  <input
                    required
                    value={task.title}
                    onChange={(e) =>
                      updateTask(index, "title", e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="e.g., Read 10 pages"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium">
                    Description
                  </label>

                  <textarea
                    rows={2}
                    value={task.description}
                    onChange={(e) =>
                      updateTask(index, "description", e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium">
                    Frequency
                  </label>

                  <select
                    value={task.frequency}
                    onChange={(e) =>
                      updateTask(
                        index,
                        "frequency",
                        e.target.value as Task["frequency"],
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="selected_days">Selected Days</option>
                  </select>
                </div>

                {task.frequency === "selected_days" && (
                  <div>
                    <label className="block text-xs font-medium">
                      Weekdays
                    </label>

                    <div className="mt-2 flex flex-wrap gap-3">
                      {weekdays.map((day) => (
                        <label
                          key={day.value}
                          className="flex items-center gap-1 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={task.weekdays.includes(day.value)}
                            onChange={(e) =>
                              updateTask(
                                index,
                                "weekdays",
                                e.target.checked
                                  ? [...task.weekdays, day.value]
                                  : task.weekdays.filter(
                                      (d) => d !== day.value,
                                    ),
                              )
                            }
                          />

                          {day.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? mode === "create"
            ? "Creating Challenge..."
            : "Saving Changes..."
          : mode === "create"
            ? "Create Challenge"
            : "Save Changes"}
      </button>
    </form>
  );
}