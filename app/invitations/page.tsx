
import Link from "next/link";

import { getMyInvitationsAction } from "@/actions/invitation.action";
import { InvitationActions } from "./invitation-actions";

export default async function InvitationsPage() {
  const result = await getMyInvitationsAction();

  if (!result.success) {
    return (
      <main className="p-6">
        <p>{result.error}</p>
      </main>
    );
  }

  const invitations = result.invitations;

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Invitations</h1>
        <p className="mt-2 text-gray-500">
          Challenges other users have invited you to join.
        </p>
      </div>

      <div className="space-y-4">
        {invitations.map((invitation) => (
          <article
            key={invitation.id}
            className="space-y-4 rounded-xl border p-5"
          >
            <div className="flex items-center gap-3">
              {invitation.inviterImage ? (
                <img
                  src={invitation.inviterImage}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 font-semibold">
                  {invitation.inviterName.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <p className="font-semibold">
                  {invitation.inviterName}
                </p>
                <p className="text-sm text-gray-500">
                  @{invitation.inviterUsername} invited you
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                {invitation.challengeTitle}
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                {invitation.challengeDescription}
              </p>
            </div>

            <InvitationActions
              invitation={{
                id: invitation.id,
                challengeId: invitation.challengeId,
                status: "pending",
              }}
            />

           
          </article>
        ))}
      </div>

      {invitations.length === 0 && (
        <div className="rounded-xl border p-10 text-center">
          <h2 className="font-semibold">No pending invitations</h2>
          <p className="mt-2 text-sm text-gray-500">
            When someone invites you to a challenge, it will appear here.
          </p>
        </div>
      )}
    </main>
  );
}
