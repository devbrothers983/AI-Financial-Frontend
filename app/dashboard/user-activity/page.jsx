"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { UserPlus, LogIn, Activity } from "lucide-react";

import { getUserActivity } from "@/services/adminService";
import Skeleton from "@/components/Skeleton";

const FILTERS = [
  { value: "", label: "All activity" },
  { value: "signup", label: "Signups" },
  { value: "login", label: "Logins" },
];

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const UserActivityPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const response = await getUserActivity();
        setEvents(response.events);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load activity");
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  const filteredEvents = filter ? events.filter((e) => e.type === filter) : events;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Activity</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Recent signups and logins across the platform.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
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
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <Activity className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">No activity yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredEvents.map((e, i) => (
              <div
                key={`${e.type}-${e.userId}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    e.type === "signup"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                  }`}
                >
                  {e.type === "signup" ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {e.username}{" "}
                    <span className="font-normal text-slate-500 dark:text-slate-400">
                      {e.type === "signup" ? "created an account" : "logged in"}
                    </span>
                  </p>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">{e.email}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatDateTime(e.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserActivityPage;
