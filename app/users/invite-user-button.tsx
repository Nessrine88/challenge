"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  async function handleInvite() {
    if (!selectedChallenge || isLoading) return;

    setIsLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const result = await sendChallengeInvitationAction({
        challengeId: selectedChallenge,
        inviteeId: userId,
      });

      if (result.success) {
        setMessage(result.message || "Invitation sent successfully!");
        setMessageType("success");
        setSelectedChallenge("");
      } else {
        setMessage(result.error || "Unable to send invitation.");
        setMessageType("error");
      }
    } catch {
      setMessage("Something went wrong.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <select
          value={selectedChallenge}
          onChange={(e) => {
            setSelectedChallenge(e.target.value);
            setMessage("");
            setMessageType("");
          }}
          aria-label="Select challenge"
          disabled={isLoading || challenges.length === 0}
          className="h-10 w-[150px] min-w-0 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 sm:w-[180px] sm:text-sm"
        >
          <option value="">Select challenge</option>
          {challenges.map((challenge) => (
            <option key={challenge.id} value={challenge.id}>
              {challenge.title}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleInvite}
          disabled={!selectedChallenge || isLoading}
          aria-label="Invite to challenge"
          title="Invite to challenge"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>

      {message && (
        <p
          role={messageType === "error" ? "alert" : "status"}
          className={`max-w-[220px] text-right text-xs ${
            messageType === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}