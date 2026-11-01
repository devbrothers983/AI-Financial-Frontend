"use client";

import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";

import { getViewAs, exitViewAs } from "@/lib/viewAs";

// Shown across the top of every page while an admin is viewing as a user
const ViewAsBanner = () => {
  const [session, setSession] = useState(null);

  useEffect(() => {
    setSession(getViewAs());
  }, []);

  if (!session) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-2 text-sm text-amber-950">
      <Eye className="h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1">
        Viewing as <strong>{session.user.username}</strong> ({session.user.email}) — read-only. Changes are blocked.
      </p>
      <button
        onClick={exitViewAs}
        className="flex items-center gap-1 rounded-md bg-amber-950/10 px-2.5 py-1 text-xs font-semibold hover:bg-amber-950/20 cursor-pointer"
      >
        <X className="h-3.5 w-3.5" /> Exit view
      </button>
    </div>
  );
};

export default ViewAsBanner;
