"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, OctagonAlert, X, ArrowRight } from "lucide-react";

const STYLES = {
  warning: {
    box: "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    title: "text-amber-900 dark:text-amber-200",
    text: "text-amber-800/90 dark:text-amber-100/80",
    chip: "bg-white/70 text-amber-900 dark:bg-amber-500/15 dark:text-amber-100",
  },
  danger: {
    box: "border-orange-200 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-500/10",
    icon: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    title: "text-orange-900 dark:text-orange-200",
    text: "text-orange-800/90 dark:text-orange-100/80",
    chip: "bg-white/70 text-orange-900 dark:bg-orange-500/15 dark:text-orange-100",
  },
  over: {
    box: "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10",
    icon: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    title: "text-red-900 dark:text-red-200",
    text: "text-red-800/90 dark:text-red-100/80",
    chip: "bg-white/70 text-red-900 dark:bg-red-500/15 dark:text-red-100",
  },
};

// Hiding lasts for today only, and a worse warning (warning → danger → over)
// shows again straight away.
const storageKey = "fincoach-pace-dismissed";
const todayKey = (level) => `${new Date().toISOString().slice(0, 10)}:${level}`;

const readDismissed = (level) => {
  try {
    return window.localStorage.getItem(storageKey) === todayKey(level);
  } catch {
    return false;
  }
};

const BudgetPaceWarning = ({ pace, formatCurrency }) => {
  const [hidden, setHidden] = useState(() => readDismissed(pace.level));

  if (hidden) return null;

  const style = STYLES[pace.level] || STYLES.warning;
  const Icon = pace.level === "over" ? OctagonAlert : AlertTriangle;
  const days = pace.daysLeft === 1 ? "today" : `the next ${pace.daysLeft} days`;
  const focus = pace.focusCategory;

  let title;
  let message;
  if (pace.level === "over") {
    title = `You're ${formatCurrency(-pace.remaining)} over this month's budget`;
    message = `There are still ${pace.daysLeft} day${pace.daysLeft === 1 ? "" : "s"} left. Please stop any spending that isn't essential until the month ends.`;
  } else {
    title = `You have only ${formatCurrency(pace.remaining)} left for ${days}`;
    message =
      pace.projectedOver > 0
        ? `At your current pace you'll spend about ${formatCurrency(pace.projected)} this month, ${formatCurrency(pace.projectedOver)} over budget. Please stop or reduce buying for now.`
        : `You've used ${Math.round(pace.percentUsed)}% of your budget with ${Math.round(100 - pace.percentOfMonth)}% of the month still to go. Please reduce buying for now.`;
  }

  const dismiss = () => {
    try {
      window.localStorage.setItem(storageKey, todayKey(pace.level));
    } catch {
      // storage blocked: hiding still works until the next reload
    }
    setHidden(true);
  };

  return (
    <div role="alert" className={`relative rounded-2xl border p-5 shadow-sm ${style.box}`}>
      <button
        onClick={dismiss}
        aria-label="Hide this warning for today"
        className={`absolute right-3 top-3 rounded-md p-1 opacity-60 hover:opacity-100 cursor-pointer ${style.title}`}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-4 pr-6">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`font-semibold ${style.title}`}>{title}</p>
          <p className={`mt-1 text-sm ${style.text}`}>{message}</p>

          {focus && (
            <p className={`mt-2 text-sm ${style.text}`}>
              Cut back on <span className="font-semibold">{focus.name}</span> first:{" "}
              {focus.limit
                ? focus.overLimit
                  ? `${formatCurrency(focus.spent)} spent, already over its ${formatCurrency(focus.limit)} limit.`
                  : `${formatCurrency(focus.spent)} of its ${formatCurrency(focus.limit)} limit is gone already.`
                : `it's your biggest spending area at ${formatCurrency(focus.spent)} (${focus.share}% of this month).`}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {pace.dailyAllowance > 0 && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.chip}`}>
                Safe to spend: {formatCurrency(pace.dailyAllowance)} / day
              </span>
            )}
            <Link
              href="/dashboard/budgets"
              className={`inline-flex items-center gap-1 text-xs font-semibold hover:underline ${style.title}`}
            >
              Review budget <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPaceWarning;
