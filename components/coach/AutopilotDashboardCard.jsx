"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Rocket, ArrowRight } from "lucide-react";

import { getAutopilot, AUTOPILOT_UPDATED_EVENT } from "@/services/coachService";
import SuggestionCard from "@/components/coach/SuggestionCard";

const DAY_MS = 24 * 60 * 60 * 1000;

// This week's plan and anything waiting for approval. Hidden when there's neither.
const AutopilotDashboardCard = () => {
  const currency = useSelector((state) => state.auth.user?.currency) || "USD";
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await getAutopilot();
      // a plan from an earlier week isn't news any more
      const current = response.plan && Date.now() - new Date(response.plan.weekStart).getTime() < 7 * DAY_MS;
      setData({ ...response, plan: current ? response.plan : null });
    } catch {
      setData(null);
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

  if (!data) return null;

  const { plan } = data;
  const pending = data.pending.slice(0, 2);
  if (!plan && pending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm dark:border-indigo-500/30 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 text-white">
            <Rocket className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{plan ? plan.headline : "Your coach suggests"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Money Autopilot</p>
          </div>
        </div>
        <Link
          href="/dashboard/coach?tab=autopilot"
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Open <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {plan && (
        <ul className="mt-3 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          {plan.lines.slice(0, 3).map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}

      {pending.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {pending.map((s) => (
            <SuggestionCard key={s._id} suggestion={s} currency={currency} compact />
          ))}
          {data.pending.length > 2 && (
            <Link href="/dashboard/coach?tab=autopilot" className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              {data.pending.length - 2} more waiting for your OK
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default AutopilotDashboardCard;
