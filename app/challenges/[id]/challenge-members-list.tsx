"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { removeChallengeMemberAction } from "@/actions/challenge.action";

type Member = {
  userId: string;
  name: string;
  username: string | null;
  image: string | null;
};

type Props = {
  challengeId: string;
  members: Member[];
  creatorId: string;
  currentUserId: string;
};

export function ChallengeMembersList({
  challengeId,
  members,
  creatorId,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isCreator = currentUserId === creatorId;

  function handleRemove(member: Member) {
    const confirmed = window.confirm(
      `Remove ${member.name} from this challenge? Other participants will be notified.`,
    );

    if (!confirmed) return;

    setError("");
    setPendingUserId(member.userId);

    startTransition(async () => {
      const result = await removeChallengeMemberAction({
        challengeId,
        userId: member.userId,
      });

      if (!result.success) {
        setError(result.error);
      }

      setPendingUserId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Participants ({members.length})
      </h2>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <ul className="divide-y divide-border rounded-xl border border-border">
        {members.map((member) => {
          const isMemberCreator = member.userId === creatorId;
          const isSelf = member.userId === currentUserId;
          const removing = isPending && pendingUserId === member.userId;

          return (
            <li
              key={member.userId}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                {member.image ? (
                  <img
                    src={member.image}
                    alt=""
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.name}
                    {isSelf && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                    {isMemberCreator && (
                      <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        Creator
                      </span>
                    )}
                  </p>

                  {member.username && (
                    <p className="truncate text-xs text-muted-foreground">
                      @{member.username}
                    </p>
                  )}
                </div>
              </div>

              {isCreator && !isMemberCreator && (
                <button
                  type="button"
                  onClick={() => handleRemove(member)}
                  disabled={isPending}
                  className="shrink-0 rounded-lg border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  {removing ? "Removing..." : "Remove"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}