"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { markAllNotificationsReadAction } from "@/actions/notification.action";

export function MarkAllReadButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsReadAction();
          router.refresh();
        })
      }
      className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
    >
      {isPending ? "Updating..." : "Mark all as read"}
    </button>
  );
}