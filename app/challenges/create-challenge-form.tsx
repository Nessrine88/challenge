
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createChallengeAction } from "@/actions/challenge.action";

export function CreateChallengeForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    visibility: "public" as "public" | "private",
    startDate: "",
    endDate: "",
    maxParticipants: "",
  });

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createChallengeAction({
        ...form,
        maxParticipants: form.maxParticipants
          ? Number(form.maxParticipants)
          : null,
        endDate: form.endDate || undefined,
        category: form.category || undefined,
      });

      if (!result.success) {
  setError(result.error ?? "Unable to create challenge.");
  return;
}

if (!result.challenge) {
  setError("Challenge was created, but its ID was not returned.");
  return;
}

router.push(`/challenges/${result.challenge.id}`);
router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="block font-medium">
          Challenge title
        </label>
        <input
          id="title"
          required
          minLength={3}
          maxLength={120}
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="mt-2 w-full rounded-md border p-3"
          placeholder="Example: Learn German in 30 days"
        />
      </div>

      <div>
        <label htmlFor="description" className="block font-medium">
          Description
        </label>
        <textarea
          id="description"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          className="mt-2 w-full rounded-md border p-3"
          placeholder="Describe the goal and what participants should accomplish."
        />
      </div>

      <div>
        <label htmlFor="category" className="block font-medium">
          Category
        </label>
        <input
          id="category"
          maxLength={50}
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
          className="mt-2 w-full rounded-md border p-3"
          placeholder="Learning, fitness, productivity..."
        />
      </div>

      <div>
        <label htmlFor="visibility" className="block font-medium">
          Visibility
        </label>
        <select
          id="visibility"
          value={form.visibility}
          onChange={(e) =>
            updateField("visibility", e.target.value)
          }
          className="mt-2 w-full rounded-md border p-3"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div>
        <label htmlFor="startDate" className="block font-medium">
          Start date
        </label>
        <input
          id="startDate"
          type="date"
          required
          value={form.startDate}
          onChange={(e) => updateField("startDate", e.target.value)}
          className="mt-2 w-full rounded-md border p-3"
        />
      </div>

      <div>
        <label htmlFor="endDate" className="block font-medium">
          End date (optional)
        </label>
        <input
          id="endDate"
          type="date"
          value={form.endDate}
          onChange={(e) => updateField("endDate", e.target.value)}
          className="mt-2 w-full rounded-md border p-3"
        />
      </div>

      <div>
        <label htmlFor="maxParticipants" className="block font-medium">
          Maximum participants (optional)
        </label>
        <input
          id="maxParticipants"
          type="number"
          min="1"
          value={form.maxParticipants}
          onChange={(e) =>
            updateField("maxParticipants", e.target.value)
          }
          className="mt-2 w-full rounded-md border p-3"
          placeholder="Leave empty for unlimited"
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
        className="rounded-md bg-black px-6 py-3 text-white disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create challenge"}
      </button>
    </form>
  );
}
