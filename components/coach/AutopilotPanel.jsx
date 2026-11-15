"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Rocket, RefreshCw, Loader2, CalendarCheck, Mail, CheckCircle2 } from "lucide-react";

import {
  getAutopilot,
  updateAutopilotSettings,
  refreshWeeklyPlan,
  AUTOPILOT_UPDATED_EVENT,
} from "@/services/coachService";
import SuggestionCard from "@/components/coach/SuggestionCard";
import Skeleton from "@/components/Skeleton";

const weekLabel = (value) =>
  `Week of ${new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;

const AutopilotPanel = () => {
  const currency = useSelector((state) => state.auth.user?.currency) || "USD";
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSetting, setSavingSetting] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await getAutopilot());
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't load Autopilot");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    window.addEventListener(AUTOPILOT_UPDATED_EVENT, load);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(AUTOPILOT_UPDATED_EVENT, load);
    };
  }, [load]);

  const makePlan = async () => {
    try {
      setRefreshing(true);
      const response = await refreshWeeklyPlan();
      toast[response.plan ? "success" : "info"](response.message);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't make your plan right now");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleWeekly = async () => {
    const next = !data.settings.weeklyPlan;
    try {
      setSavingSetting(true);
      const response = await updateAutopilotSettings({ weeklyPlan: next });
      setData((prev) => ({ ...prev, settings: response.settings }));
      toast.success(response.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save that");
    } finally {
      setSavingSetting(false);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const { plan, pending, recent, settings } = data;

  return (
    <div className="flex flex-col gap-5">
      {/* ---- what it is, and the switch ---- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 text-white">
            <Rocket className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 dark:text-white">Money Autopilot</p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Your coach makes the plan and sets it up for you: a budget, a limit, a goal or a bill. Nothing changes until you tap
              Approve.
            </p>
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
          <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <Mail className="h-4 w-4 text-slate-400" />
            <span>
              Weekly plan every Monday
              <span className="block text-xs text-slate-500 dark:text-slate-400">In your inbox and by email</span>
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.weeklyPlan}
            aria-label="Weekly plan every Monday"
            onClick={toggleWeekly}
            disabled={savingSetting}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 cursor-pointer ${
              settings.weeklyPlan ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                settings.weeklyPlan ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      {/* ---- this week's plan ---- */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
            <CalendarCheck className="h-4 w-4 text-emerald-500" /> Your weekly plan
          </h2>
          <button
            onClick={makePlan}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {plan ? "Update my plan" : "Make my plan now"}
          </button>
        </div>

        {plan ? (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/5">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">{weekLabel(plan.weekStart)}</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{plan.headline}</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-slate-700 dark:text-slate-300">
              {plan.lines.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Your first plan arrives on Monday. Tap &quot;Make my plan now&quot; to see it today.
          </p>
        )}
      </section>

      {/* ---- waiting for approval ---- */}
      <section>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Waiting for your OK</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Nothing right now. Ask the coach things like &quot;Make me a budget&quot; or &quot;Help me save for a trip&quot; and it&apos;ll
            offer to set them up.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {pending.map((s) => (
              <SuggestionCard key={s._id} suggestion={s} currency={currency} />
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recently set up</h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {recent.map((s) => (
              <li key={s._id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                <span className="shrink-0 text-xs text-slate-400">
                  {new Date(s.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default AutopilotPanel;
