"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { FileText, Search, UserPlus, LogIn, ChevronRight } from "lucide-react";

import { getUserActivity } from "@/services/adminService";
import Skeleton from "@/components/Skeleton";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatTime = (value) => new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const formatRelative = (value) => {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
};

const EVENT_META = {
  signup: {
    label: "Account created",
    icon: UserPlus,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  },
  login: {
    label: "Signed in",
    icon: LogIn,
    className: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20",
  },
};

const FILTERS = [
  { value: "", label: "All events" },
  { value: "signup", label: "Account created" },
  { value: "login", label: "Signed in" },
];

const EventBadge = ({ type }) => {
  const meta = EVENT_META[type] || { label: type, icon: FileText, className: "bg-slate-100 text-slate-600 ring-slate-500/20" };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
};

const RoleBadge = ({ role }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
      role === "admin"
        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
    }`}
  >
    {role}
  </span>
);

const Avatar = ({ name }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
    {name?.[0] || "?"}
  </span>
);

const SummaryTile = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{value}</p>
  </div>
);

const LogsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await getUserActivity();
        setEvents(response.events);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(
      (e) =>
        (!typeFilter || e.type === typeFilter) &&
        (!q || e.username.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
    );
  }, [events, query, typeFilter]);

  const summary = useMemo(
    () => ({
      total: events.length,
      signups: events.filter((e) => e.type === "signup").length,
      logins: events.filter((e) => e.type === "login").length,
      users: new Set(events.map((e) => String(e.userId))).size,
    }),
    [events]
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Logs</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Audit trail of account sign-ups and sign-ins across the platform.
          </p>
        </div>
      </div>

      {!loading && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryTile label="Events shown" value={summary.total} />
          <SummaryTile label="Accounts created" value={summary.signups} />
          <SummaryTile label="Sign-ins" value={summary.logins} />
          <SummaryTile label="Unique users" value={summary.users} />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or email..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-500/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:ring-indigo-500/20"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
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
            <p className="text-sm text-slate-400 dark:text-slate-500">No log entries match.</p>
          </div>
        ) : (
          <>
            {/* Mobile: one card per event */}
            <div className="flex flex-col gap-2 md:hidden">
              {filteredEvents.map((e, i) => (
                <Link
                  key={`${e.type}-${e.userId}-${i}`}
                  href={`/dashboard/users/${e.userId}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <Avatar name={e.username} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{e.username}</p>
                      <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatRelative(e.timestamp)}</span>
                    </div>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{e.email}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <EventBadge type={e.type} />
                      <RoleBadge role={e.role} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Date &amp; time</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEvents.map((e, i) => (
                    <tr key={`${e.type}-${e.userId}-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <EventBadge type={e.type} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={e.username} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 dark:text-white">{e.username}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{e.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={e.role} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-slate-700 dark:text-slate-300">
                          {formatDate(e.timestamp)} · {formatTime(e.timestamp)}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{formatRelative(e.timestamp)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/users/${e.userId}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          View user <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LogsPage;
