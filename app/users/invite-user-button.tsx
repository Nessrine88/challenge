
"use client";

import { useState } from "react";
import { sendChallengeInvitationAction } from "@/actions/invitation.action";

type Challenge = {
  id: string;
  title: string;
};

type Props = {
  userId: string;
  challenges: Challenge[];
};

export function InviteUserButton({ userId, challenges }: Props) {
  const [selectedChallenge, setSelectedChallenge] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleInvite() {
    if (!selectedChallenge) {
      setMessage("Select a challenge first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await sendChallengeInvitationAction({
        challengeId: selectedChallenge,
        inviteeId: userId,
      });

      setMessage(
        result.success
          ? "Invitation sent successfully!"
          : result.error
      );

      if (result.success) {
        setSelectedChallenge("");
      }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (challenges.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        You need to create an active challenge before inviting users.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <select
        value={selectedChallenge}
        onChange={(event) => setSelectedChallenge(event.target.value)}
        className="w-full rounded-lg border p-3"
      >
        <option value="">Select a challenge</option>

        {challenges.map((challenge) => (
          <option key={challenge.id} value={challenge.id}>
            {challenge.title}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleInvite}
        disabled={loading || !selectedChallenge}
        className="rounded-lg bg-black px-5 py-2.5 text-white disabled:opacity-50"
      >
        {loading ? "Sending..." : "Invite to challenge"}
      </button>

      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
