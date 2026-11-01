"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

import { getAdminGrowth } from "@/services/adminService";
import Skeleton from "@/components/Skeleton";

const PLOT_HEIGHT = 120;

const formatWeek = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const weekRange = (iso) => {
  const end = new Date(iso);
  end.setUTCDate(end.getUTCDate() + 6);
  return `${formatWeek(iso)} – ${formatWeek(end.toISOString())}`;
};

// round the axis max up to a readable number (1, 2, 5 × 10ⁿ)
const niceMax = (value) => {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((s) => s * magnitude >= value);
  return step * magnitude;
};

// Change vs last week, shown with an arrow and words (never colour alone)
const Delta = ({ current, previous }) => {
  if (previous === 0 && current === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-slate-400 dark:text-slate-500">
        <Minus className="h-3 w-3" /> no change
      </span>
    );
  }
  const diff = current - previous;
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  const text = previous === 0 ? `+${diff} vs last week` : `${diff > 0 ? "+" : ""}${Math.round((diff / previous) * 100)}% vs last week`;
  return (
    <span className="flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400">
      <Icon className="h-3 w-3" /> {text}
    </span>
  );
};

// One measure per chart — the three never share an axis
const WeeklyBars = ({ title, unit, data, field }) => {
  const [hovered, setHovered] = useState(null);

  const values = data.map((w) => w[field]);
  const max = niceMax(Math.max(...values, 0));
  const current = values[values.length - 1] ?? 0;
  const previous = values[values.length - 2] ?? 0;
  const gridlines = [max, max / 2, 0];
  const labelIndexes = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{current}</p>
        <span className="text-xs text-slate-400 dark:text-slate-500">this week</span>
        <Delta current={current} previous={previous} />
      </div>

      <div className="mt-4 flex gap-2">
        {/* y-axis labels */}
        <div className="relative w-6 shrink-0 text-right text-[10px] text-slate-400 dark:text-slate-500" style={{ height: PLOT_HEIGHT }}>
          {gridlines.map((g) => (
            <span key={g} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - g / max) * 100}%` }}>
              {Number.isInteger(g) ? g : g.toFixed(1)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* recessive gridlines */}
          <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: PLOT_HEIGHT }}>
            {gridlines.map((g) => (
              <div
                key={g}
                className={`absolute inset-x-0 border-t ${g === 0 ? "border-slate-300 dark:border-slate-600" : "border-dashed border-slate-100 dark:border-slate-800"}`}
                style={{ top: `${(1 - g / max) * 100}%` }}
              />
            ))}
          </div>

          {/* bars: each column is a full-height hit target */}
          <div className="relative flex items-end gap-[2px]" style={{ height: PLOT_HEIGHT }}>
            {data.map((w, i) => {
              const value = w[field];
              const height = value > 0 ? Math.max((value / max) * PLOT_HEIGHT, 2) : 0;
              const isHovered = hovered === i;
              const isLast = i === data.length - 1;
              return (
                <div
                  key={w.weekStart}
                  tabIndex={0}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${weekRange(w.weekStart)}: ${value} ${unit}`}
                  className="relative flex h-full flex-1 cursor-default items-end outline-none"
                >
                  <div
                    className={`w-full rounded-t bg-indigo-500 transition-opacity ${hovered !== null && !isHovered ? "opacity-40" : ""}`}
                    style={{ height }}
                  />
                  {isHovered && (
                    <div
                      className={`pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800 ${
                        i < data.length / 2 ? "left-0" : "right-0"
                      }`}
                    >
                      <p className="text-slate-500 dark:text-slate-400">
                        {weekRange(w.weekStart)}
                        {isLast && " (so far)"}
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {value} {unit}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* sparse x labels: first, middle, last week */}
          <div className="relative mt-1.5 h-3 text-[10px] text-slate-400 dark:text-slate-500">
            {data.map((w, i) =>
              labelIndexes.has(i) ? (
                <span
                  key={w.weekStart}
                  className={`absolute ${i === 0 ? "left-0" : i === data.length - 1 ? "right-0" : "-translate-x-1/2"}`}
                  style={i !== 0 && i !== data.length - 1 ? { left: `${((i + 0.5) / data.length) * 100}%` } : undefined}
                >
                  {i === data.length - 1 ? "This week" : formatWeek(w.weekStart)}
                </span>
              ) : null
            )}
          </div>
        </div>
      </div>

      {/* table view for screen readers */}
      <table className="sr-only">
        <caption>{title} by week</caption>
        <thead>
          <tr>
            <th>Week</th>
            <th>{unit}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((w) => (
            <tr key={w.weekStart}>
              <td>{weekRange(w.weekStart)}</td>
              <td>{w[field]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const GrowthCharts = () => {
  const [weeks, setWeeks] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getAdminGrowth({ weeks: 12 })
      .then((response) => setWeeks(response.weeks))
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;

  return (
    <div>
      <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Growth — last 12 weeks</h2>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Weeks run Monday to Sunday (UTC). Active users and AI coach usage are counted from when activity tracking began.
      </p>
      {!weeks ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <WeeklyBars title="New signups" unit="signups" data={weeks} field="signups" />
          <WeeklyBars title="Active users" unit="active users" data={weeks} field="activeUsers" />
          <WeeklyBars title="AI coach requests" unit="requests" data={weeks} field="coachUses" />
        </div>
      )}
    </div>
  );
};

export default GrowthCharts;
