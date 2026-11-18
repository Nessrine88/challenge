
"use client";

import { useState } from "react";

import { respondToChallengeInvitationAction } from "@/actions/invitation.action";

type Invitation = {
  id: string;
  challengeId: string;
  status: "pending";
};

type Props = {
  invitation: Invitation;
};

export function InvitationActions({ invitation }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function respond(decision: "accepted" | "declined") {
    setLoading(true);
    setMessage("");

    try {
      const result = await respondToChallengeInvitationAction({
        invitationId: invitation.id,
        decision,
      });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setMessage(result.message);

      // Refresh the server-rendered invitation list.
      window.location.reload();
    } catch {
      setMessage("Unable to process invitation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => respond("accepted")}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Processing..." : "Accept"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => respond("declined")}
          className="rounded-lg border px-4 py-2 disabled:opacity-50"
        >
          Decline
        </button>
      </div>

      {message && (
        <p className="text-sm text-gray-500" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
