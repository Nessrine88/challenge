
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  joinChallengeAction,
  leaveChallengeAction,
} from "@/actions/challenge.action";

type Props = {
  challengeId: string;
  initialIsJoined: boolean;
  initialParticipantCount: number;
};

export function ChallengeMembershipButton({
  challengeId,
  initialIsJoined,
  initialParticipantCount,
}: Props) {
  const router = useRouter();

  const [isJoined, setIsJoined] = useState(initialIsJoined);
  const [participantCount, setParticipantCount] = useState(
    initialParticipantCount
  );

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleMembership() {
    setError("");

    startTransition(async () => {
      const result = isJoined
        ? await leaveChallengeAction(challengeId)
        : await joinChallengeAction(challengeId);

      if (!result.success) {
        setError(result.error ?? "Unable to update membership.");
        return;
      }

      setIsJoined((previous) => !previous);

      setParticipantCount((previous) =>
        previous + (isJoined ? -1 : 1)
      );

      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
        {participantCount} participants
      </p>

      <button
        type="button"
        onClick={handleMembership}
        disabled={isPending}
        className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50"
      >
        {isPending
          ? "Please wait..."
          : isJoined
            ? "Leave challenge"
            : "Join challenge"}
      </button>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
