
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCheckinAction } from "@/actions/checkin.action";

type Props = {
  taskId: string;
  checkinDate: string;
  initialCompleted: boolean;
};

export function ChallengeCheckinButton({
  taskId,
  checkinDate,
  initialCompleted,
}: Props) {
  const router = useRouter();

  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCheckin() {
    setError("");

    startTransition(async () => {
      const result = await createCheckinAction({
        taskId,
        checkinDate,
      });

      if (!result.success) {
        setError(result.error ?? "Unable to record check-in.");
        return;
      }

      setIsCompleted(true);
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckin}
        disabled={isCompleted || isPending}
      >
        {isPending
          ? "Saving..."
          : isCompleted
            ? "Completed"
            : "Mark as completed"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
