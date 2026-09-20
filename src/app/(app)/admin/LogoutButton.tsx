"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.refresh();
      }}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
    >
      Sign out
    </button>
  );
}
