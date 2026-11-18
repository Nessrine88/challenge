"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="mt-6 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      Sign out
    </button>
  );
}