"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, X } from "lucide-react";

import { getActiveAnnouncements, dismissAnnouncement } from "@/services/announcementService";

const LEVEL_STYLES = {
  info: "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
};

// Active admin announcements, shown above every dashboard page until dismissed
const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getActiveAnnouncements()
      .then((response) => !cancelled && setAnnouncements(response.announcements || []))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = (id) => {
    setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    dismissAnnouncement(id).catch(() => {});
  };

  if (!announcements.length) return null;

  return (
    <div className="flex flex-col gap-2 px-4 pt-4 sm:px-6">
      {announcements.map((a) => (
        <div key={a._id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${LEVEL_STYLES[a.level] || LEVEL_STYLES.info}`}>
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{a.title}</p>
            {a.body && <p className="mt-0.5 whitespace-pre-wrap text-sm opacity-90">{a.body}</p>}
            {a.link && (
              <Link href={a.link} className="mt-1.5 inline-block text-sm font-semibold underline underline-offset-2">
                {a.linkLabel || "Learn more"}
              </Link>
            )}
          </div>
          <button
            onClick={() => handleDismiss(a._id)}
            className="shrink-0 rounded-lg p-1 opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10 cursor-pointer"
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBanner;
