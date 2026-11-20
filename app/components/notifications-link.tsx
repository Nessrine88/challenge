import Link from "next/link";

import { getUnreadNotificationCountAction } from "@/actions/notification.action";

// Async server component: drop it into your navbar next to the invitations link.
export async function NotificationsLink() {
  const result = await getUnreadNotificationCountAction();

  return (
    <Link href="/notifications" className="relative text-sm">
      Notifications
      {result.count > 0 && (
        <span className="ml-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-medium text-white">
          {result.count > 99 ? "99+" : result.count}
        </span>
      )}
    </Link>
  );
}