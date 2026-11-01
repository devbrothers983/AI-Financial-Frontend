"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  NOTIFICATIONS_UPDATED_EVENT,
} from "@/services/notificationService";
import { TYPE_ICONS, LEVEL_TONES, timeAgo } from "./notificationMeta";

const POLL_MS = 60000;

const NotificationBell = () => {
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await getNotifications({ limit: 8 });
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch {
      // the bell shouldn't raise error toasts
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, load);
    return () => {
      clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, load);
    };
  }, [load, pathname]);

  // close when clicking outside the panel
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await load();
      setLoading(false);
    }
  };

  const handleOpenNotification = async (n) => {
    setOpen(false);
    if (!n.readAt) {
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnreadCount((c) => Math.max(c - 1, 0));
      markNotificationRead(n._id).catch(() => {});
    }
    if (n.link) router.push(n.link);
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, readAt: x.readAt || new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">You&apos;re all caught up.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] || Bell;
                  return (
                    <li key={n._id}>
                      <button
                        onClick={() => handleOpenNotification(n)}
                        className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                          n.readAt ? "" : "bg-indigo-50/40 dark:bg-indigo-500/5"
                        }`}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${LEVEL_TONES[n.level] || LEVEL_TONES.info}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${n.readAt ? "text-slate-700 dark:text-slate-300" : "font-semibold text-slate-900 dark:text-white"}`}>
                              {n.title}
                            </p>
                            {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                          </div>
                          {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{n.body}</p>}
                          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{timeAgo(n.createdAt)}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 py-2.5 text-center text-xs font-medium text-indigo-600 hover:bg-slate-50 dark:border-slate-800 dark:text-indigo-400 dark:hover:bg-slate-800/50"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
