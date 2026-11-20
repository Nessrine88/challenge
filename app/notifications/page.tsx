import Link from "next/link";
import { redirect } from "next/navigation";

import { getMyNotificationsAction } from "@/actions/notification.action";
import { MarkAllReadButton } from "../components/mark-all-read-button";

export default async function NotificationsPage() {
  const result = await getMyNotificationsAction();

  if (!result.success) {
    if (result.error === "Unauthorized.") redirect("/sign-in");
    return <p className="p-8">Unable to load notifications.</p>;
  }

  const items = result.notifications;
  const hasUnread = items.some((item) => item.readAt === null);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {hasUnread && <MarkAllReadButton />}
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-gray-500">
          You have no notifications.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const unread = item.readAt === null;

            // A removed user may no longer have access, so no link for them.
            const href =
              item.challengeId && item.type !== "removed_from_challenge"
                ? `/challenges/${item.challengeId}`
                : null;

            const body = (
              <>
                <p className="text-sm">{item.message}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.createdAt.toLocaleString("en-GB")}
                </p>
              </>
            );

            return (
              <li
                key={item.id}
                className={
                  unread
                    ? "rounded-xl border border-black/30 bg-gray-50 p-4"
                    : "rounded-xl border p-4"
                }
              >
                {href ? (
                  <Link href={href} className="block">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}