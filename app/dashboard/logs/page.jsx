"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FileText, Search } from "lucide-react";

import { getUserActivity } from "@/services/adminService";
import Skeleton from "@/components/Skeleton";

const formatTimestamp = (value) =>
  new Date(value).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

const EVENT_TAG = {
  signup: { label: "SIGNUP", className: "text-emerald-400" },
  login: { label: "LOGIN", className: "text-sky-400" },
};

const LogsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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
    if (!query.trim()) return events;
    const q = query.trim().toLowerCase();
    return events.filter((e) => e.username.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
  }, [events, query]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-800">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Logs</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Raw event log of account activity — signups and logins.
          </p>
        </div>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by username or email..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-500/20"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-400 dark:text-slate-500">No log entries match.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs">
            {filteredEvents.map((e, i) => {
              const tag = EVENT_TAG[e.type] || { label: e.type.toUpperCase(), className: "text-slate-400" };
              return (
                <div key={`${e.type}-${e.userId}-${i}`} className="whitespace-nowrap py-1 text-slate-400">
                  <span className="text-slate-600">[{formatTimestamp(e.timestamp)}]</span>{" "}
                  <span className={`font-semibold ${tag.className}`}>{tag.label}</span>{" "}
                  <span className="text-slate-200">{e.username}</span>{" "}
                  <span className="text-slate-500">&lt;{e.email}&gt;</span>{" "}
                  <span className="text-slate-600">role={e.role}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsPage;
