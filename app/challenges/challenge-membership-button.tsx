
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
  const [isPending, startTransition] = useTransition();

  const [isJoined, setIsJoined] = useState(initialIsJoined);
  const [participantCount, setParticipantCount] =
    useState(initialParticipantCount);
  const [error, setError] = useState("");

  function handleMembership() {
    setError("");

    startTransition(async () => {
      const result = isJoined
        ? await leaveChallengeAction(challengeId)
        : await joinChallengeAction(challengeId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsJoined(!isJoined);
      setParticipantCount((previous) =>
        previous + (isJoined ? -1 : 1)
      );

      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        {participantCount} participant{participantCount === 1 ? "" : "s"}
      </p>

      <button
        type="button"
        onClick={handleMembership}
        disabled={isPending}
        className={`rounded-md px-5 py-3 font-medium text-white disabled:opacity-50 ${
          isJoined
            ? "bg-red-600 hover:bg-red-700"
            : "bg-black hover:bg-gray-800"
        }`}
      >
        {isPending
          ? "Please wait..."
          : isJoined
            ? "Leave challenge"
            : "Join challenge"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
