"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { startViewAs } from "@/lib/viewAs";

// Opened in a new tab by an admin. The read-only token arrives in the URL
// hash (never sent to any server or logged), is kept for this tab only, and
// the tab then loads the user's dashboard.
export default function ViewAsPage() {
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const token = params.get("token");
      const user = JSON.parse(params.get("user") || "null");
      if (!token || !user?._id) throw new Error("missing");

      startViewAs({ token, user, startedAt: new Date().toISOString() });
      window.history.replaceState(null, "", "/view-as");
      window.location.replace("/dashboard");
    } catch {
      setError(true);
    }
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      {error ? (
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">This view link is invalid or incomplete.</p>
          <Link href="/dashboard/users" className="mt-3 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Back to users
          </Link>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Opening read-only view...
        </p>
      )}
    </main>
  );
}
