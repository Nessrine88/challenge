
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChallengeTaskAction } from "@/actions/challenge.action";

type Props = {
  challengeId: string;
};

export function CreateTaskForm({ challengeId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createChallengeTaskAction({
        challengeId,
        title,
        description,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setTitle("");
      setDescription("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-5">
      <h3 className="text-lg font-semibold">Add a task</h3>

      <div>
        <label htmlFor="task-title" className="block text-sm font-medium">
          Task title
        </label>
        <input
          id="task-title"
          required
          minLength={3}
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-md border p-3"
          placeholder="Example: Learn 10 German words"
        />
      </div>

      <div>
        <label htmlFor="task-description" className="block text-sm font-medium">
          Instructions (optional)
        </label>
        <textarea
          id="task-description"
          maxLength={2000}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 w-full rounded-md border p-3"
          placeholder="Describe what participants should do."
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-black px-5 py-3 text-white disabled:opacity-50"
      >
        {isPending ? "Adding..." : "Add task"}
      </button>
    </form>
  );
}
