"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  notifyNotificationsUpdated,
} from "@/services/notificationService";
import { TYPE_ICONS, LEVEL_TONES, timeAgo } from "@/components/notifications/notificationMeta";
import Skeleton from "@/components/Skeleton";

const FILTERS = [
  { value: "", label: "All" },
  { value: "unread", label: "Unread" },
];

const NotificationsPage = () => {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filter) params.status = filter;
      const response = await getNotifications(params);
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
      setPagination(response.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleOpen = async (n) => {
    if (!n.readAt) {
      try {
        await markNotificationRead(n._id);
        notifyNotificationsUpdated();
      } catch {
        // still navigate
      }
    }
    if (n.link) router.push(n.link);
    else fetchNotifications();
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      notifyNotificationsUpdated();
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update notifications");
    }
  };

  const handleDelete = async (n) => {
    try {
      await deleteNotification(n._id);
      setNotifications((prev) => prev.filter((x) => x._id !== n._id));
      if (!n.readAt) {
        setUnreadCount((c) => Math.max(c - 1, 0));
        notifyNotificationsUpdated();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete notification");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {unreadCount ? `${unreadCount} unread` : "You're all caught up."}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              filter === f.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <Bell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">No notifications here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              return (
                <li key={n._id} className={`flex items-start gap-3 px-4 py-3 ${n.readAt ? "" : "bg-indigo-50/40 dark:bg-indigo-500/5"}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${LEVEL_TONES[n.level] || LEVEL_TONES.info}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <button onClick={() => handleOpen(n)} className="min-w-0 flex-1 text-left cursor-pointer">
                    <p className={`text-sm ${n.readAt ? "text-slate-700 dark:text-slate-300" : "font-semibold text-slate-900 dark:text-white"}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{n.body}</p>}
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{timeAgo(n.createdAt)}</p>
                  </button>
                  <button
                    onClick={() => handleDelete(n)}
                    title="Delete"
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={pagination.currentPage <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
