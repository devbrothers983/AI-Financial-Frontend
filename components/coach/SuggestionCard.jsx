"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { CheckCircle2, X, Loader2, PieChart, Target, Receipt, SlidersHorizontal, ArrowRight, Clock } from "lucide-react";

import { approveSuggestion, dismissSuggestion, announceAutopilotChange } from "@/services/coachService";
import { announceCashflowChange } from "@/services/cashflowService";

const ICONS = {
  create_budget: PieChart,
  set_category_limit: SlidersHorizontal,
  create_goal: Target,
  add_bill: Receipt,
};

const formatCategory = (value = "") => value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// The details behind a suggestion, so the user sees exactly what will be saved
const Details = ({ suggestion, currency }) => {
  const money = (v) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(v);
    } catch {
      return `${currency} ${v}`;
    }
  };
  const p = suggestion.payload || {};

  if (suggestion.type === "create_budget" && p.categories?.length) {
    return (
      <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
        {p.categories.slice(0, 10).map((c) => (
          <li key={c.category} className="flex justify-between gap-2">
            <span className="truncate">{formatCategory(c.category)}</span>
            <span className="tabular-nums">{money(c.limit)}</span>
          </li>
        ))}
        {p.categories.length > 10 && <li className="opacity-70">and {p.categories.length - 10} more</li>}
      </ul>
    );
  }
  return null;
};

// One "the coach can set this up" card, with Approve and Dismiss
const SuggestionCard = ({ suggestion: initial, currency = "USD", compact = false }) => {
  const [suggestion, setSuggestion] = useState(initial);
  const [busy, setBusy] = useState(null);
  const Icon = ICONS[suggestion.type] || CheckCircle2;

  const approve = async () => {
    try {
      setBusy("approve");
      const response = await approveSuggestion(suggestion._id);
      setSuggestion(response.suggestion);
      toast.success(response.message);
      announceAutopilotChange();
      announceCashflowChange();
    } catch (err) {
      const status = err.response?.status;
      toast.error(err.response?.data?.message || "Couldn't do that right now");
      if (status === 410) setSuggestion((s) => ({ ...s, status: "expired" }));
      if (status === 409) setSuggestion((s) => ({ ...s, status: "applied" }));
    } finally {
      setBusy(null);
    }
  };

  const dismiss = async () => {
    try {
      setBusy("dismiss");
      await dismissSuggestion(suggestion._id);
      setSuggestion((s) => ({ ...s, status: "dismissed" }));
      announceAutopilotChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't dismiss it");
    } finally {
      setBusy(null);
    }
  };

  const done = suggestion.status === "applied";
  const closed = suggestion.status === "dismissed" || suggestion.status === "expired";

  return (
    <div
      className={`rounded-xl border p-3 text-sm ${
        done
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
          : closed
          ? "border-slate-200 bg-slate-50 opacity-70 dark:border-slate-700 dark:bg-slate-800/50"
          : "border-indigo-200 bg-white dark:border-indigo-500/30 dark:bg-slate-900"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            done
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
              : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
          }`}
        >
          {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900 dark:text-white">{suggestion.title}</p>
          {suggestion.reason && !compact && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{suggestion.reason}</p>}
          {!compact && !done && !closed && <Details suggestion={suggestion} currency={currency} />}

          {done ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Done.
              {suggestion.resultLink && (
                <Link href={suggestion.resultLink} className="inline-flex items-center gap-0.5 hover:underline">
                  See it <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </p>
          ) : closed ? (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              {suggestion.status === "expired" ? (
                <>
                  <Clock className="h-3 w-3" /> Expired. Ask the coach for a fresh one.
                </>
              ) : (
                "Dismissed"
              )}
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={approve}
                disabled={Boolean(busy)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
              >
                {busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Approve
              </button>
              <button
                onClick={dismiss}
                disabled={Boolean(busy)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                {busy === "dismiss" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionCard;
