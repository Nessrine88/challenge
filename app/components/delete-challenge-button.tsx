
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteChallengeAction } from "@/actions/challenge.action";

type Props = {
  challengeId: string;
};

export function DeleteChallengeButton({ challengeId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this challenge? All associated tasks, schedules and check-ins may also be deleted.",
    );

    if (!confirmed) return;

    setError("");

    startTransition(async () => {
      const result = await deleteChallengeAction(challengeId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/challenges");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50"
      >
        {isPending ? "Deleting..." : "Delete challenge"}
      </button>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
