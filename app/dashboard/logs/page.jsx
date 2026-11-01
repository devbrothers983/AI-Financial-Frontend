"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  FileText,
  Search,
  UserPlus,
  LogIn,
  ShieldAlert,
  KeyRound,
  Receipt,
  Wallet,
  Target,
  UserCog,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { getActivityLogs } from "@/services/adminService";
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

const TONES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20",
  red: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-500/20",
};

// Badge label/icon/colour for each logged action
const ACTION_META = {
  "auth.signup": { label: "Account created", icon: UserPlus, tone: "green" },
  "auth.login": { label: "Signed in", icon: LogIn, tone: "sky" },
  "auth.login_failed": { label: "Failed sign-in", icon: ShieldAlert, tone: "red" },
  "auth.login_blocked": { label: "Blocked sign-in", icon: ShieldAlert, tone: "red" },
  "auth.password_reset": { label: "Password reset", icon: KeyRound, tone: "amber" },
  "auth.logout_all": { label: "Signed out everywhere", icon: LogIn, tone: "slate" },
  "auth.account_delete": { label: "Account deleted", icon: ShieldAlert, tone: "red" },
  "message.send": { label: "Message sent", icon: MessageSquare, tone: "sky" },
  "coach.ask": { label: "AI coach request", icon: Target, tone: "violet" },
  "message.reply": { label: "User replied", icon: MessageSquare, tone: "sky" },
  "profile.password_change": { label: "Password changed", icon: KeyRound, tone: "amber" },
  "profile.update": { label: "Profile updated", icon: UserCog, tone: "slate" },
  "profile.avatar_update": { label: "Photo changed", icon: UserCog, tone: "slate" },
  "profile.avatar_remove": { label: "Photo removed", icon: UserCog, tone: "slate" },
  "admin.message_reply": { label: "Admin reply", icon: MessageSquare, tone: "indigo" },
  "admin.message_delete": { label: "Message deleted", icon: MessageSquare, tone: "indigo" },
};

const CATEGORY_META = {
  transaction: { noun: "Transaction", icon: Receipt, tone: "slate" },
  budget: { noun: "Budget", icon: Wallet, tone: "violet" },
  goal: { noun: "Goal", icon: Target, tone: "amber" },
  admin: { noun: "Admin action", icon: ShieldCheck, tone: "indigo" },
};

const VERB_LABEL = { create: "added", update: "edited", delete: "deleted", complete: "completed" };

const getActionMeta = (log) => {
  if (ACTION_META[log.action]) return ACTION_META[log.action];
  const category = CATEGORY_META[log.category];
  const verb = log.action.split(".")[1];
  if (category && log.category !== "admin") {
    return {
      label: `${category.noun} ${VERB_LABEL[verb] || verb}`,
      icon: category.icon,
      tone: verb === "delete" ? "red" : category.tone,
    };
  }
  if (category) return { label: category.noun, icon: category.icon, tone: category.tone };
  return { label: log.action, icon: FileText, tone: "slate" };
};

const FILTERS = [
  { value: "", label: "All events" },
  { value: "auth", label: "Sign-ins & security" },
  { value: "failed", label: "Failed or blocked sign-ins" },
  { value: "transaction", label: "Transactions" },
  { value: "budget", label: "Budgets" },
  { value: "goal", label: "Goals" },
  { value: "profile", label: "Profile changes" },
  { value: "message", label: "Messages" },
  { value: "admin", label: "Admin actions" },
];

const ActionBadge = ({ log }) => {
  const meta = getActionMeta(log);
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONES[meta.tone]}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
};

const RoleBadge = ({ role }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
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

const SummaryTile = ({ label, value, tone = "text-slate-900 dark:text-white" }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
  </div>
);

// Profile link for whoever the entry is about (the user, or the admin's target)
const userLinkFor = (log) => log.targetUserId || log.userId;

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 25 };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (filter === "failed") params.action = "auth.login_failed,auth.login_blocked";
      else if (filter) params.category = filter;

      const response = await getActivityLogs(params);
      setLogs(response.logs);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Logs</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Audit trail of sign-ins, data changes and admin actions across the platform.
            </p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          title="Refresh"
          className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {summary && (
        <>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Last 24 hours</p>
          <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryTile label="Sign-ins" value={summary.signIns} />
            <SummaryTile
              label="Failed or blocked sign-ins"
              value={summary.failedSignIns}
              tone={summary.failedSignIns > 0 ? "text-red-500 dark:text-red-400" : undefined}
            />
            <SummaryTile label="Data changes" value={summary.dataChanges} />
            <SummaryTile label="Admin actions" value={summary.adminActions} />
          </div>
        </>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, email or description..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-500/20"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
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
        {loading && logs.length === 0 ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-400 dark:text-slate-500">No log entries match.</p>
          </div>
        ) : (
          <>
            {/* Mobile: one card per entry */}
            <div className="flex flex-col gap-2 md:hidden">
              {logs.map((log) => {
                const linkId = userLinkFor(log);
                const card = (
                  <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                    <Avatar name={log.username} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{log.username || log.email || "Unknown"}</p>
                        <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatRelative(log.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{log.description}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <ActionBadge log={log} />
                        <RoleBadge role={log.role} />
                      </div>
                      {(log.device || log.ip) && (
                        <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">
                          {[log.device, log.ip].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                );
                return linkId ? (
                  <Link key={log._id} href={`/dashboard/users/${linkId}`}>
                    {card}
                  </Link>
                ) : (
                  <div key={log._id}>{card}</div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Performed by</th>
                    <th className="px-4 py-3 font-medium">Details</th>
                    <th className="px-4 py-3 font-medium">Device / IP</th>
                    <th className="px-4 py-3 font-medium">Date &amp; time</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => {
                    const linkId = userLinkFor(log);
                    return (
                      <tr key={log._id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <ActionBadge log={log} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={log.username} />
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 truncate font-medium text-slate-900 dark:text-white">
                                {log.username || "Unknown"} <RoleBadge role={log.role} />
                              </p>
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{log.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-xs px-4 py-3 text-slate-600 dark:text-slate-300">{log.description}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          <p>{log.device || "—"}</p>
                          {log.ip && <p className="text-slate-400 dark:text-slate-500">{log.ip}</p>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <p className="text-slate-700 dark:text-slate-300">
                            {formatDate(log.createdAt)} · {formatTime(log.createdAt)}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{formatRelative(log.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {linkId && (
                            <Link
                              href={`/dashboard/users/${linkId}`}
                              className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              View user <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages} — {pagination.totalLogs} entries
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

export default LogsPage;
