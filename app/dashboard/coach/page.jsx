"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ArrowRight, AlertTriangle, CheckCircle2, XCircle, MessageCircle, ShoppingBag, Wallet, CalendarDays, Target } from "lucide-react";
import Link from "next/link";

import { checkAffordability } from "@/services/coachService";
import CoachChat from "@/components/coach/CoachChat";

const RECOMMENDATION_STYLES = {
  AFFORDABLE: {
    icon: CheckCircle2,
    badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    label: "Affordable",
  },
  CAUTION: {
    icon: AlertTriangle,
    badge: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    label: "Proceed with caution",
  },
  NOT_RECOMMENDED: {
    icon: XCircle,
    badge: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    label: "Not recommended",
  },
};

const RISK_STYLES = {
  LOW: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  MEDIUM: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  HIGH: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

const inputClass = (hasError) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-500/20"
      : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-500/20"
  }`;

const money = (value, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value || 0);
  } catch {
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  }
};

const weeksLabel = (weeks) => {
  if (weeks < 1) return "less than a week";
  const rounded = Math.round(weeks);
  return rounded === 1 ? "about 1 week" : `about ${rounded} weeks`;
};

// One "before → after" row of the impact section
const ImpactRow = ({ icon: Icon, label, before, after, bad }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
    <Icon className="h-4 w-4 shrink-0 text-slate-400" />
    <p className="flex-1 text-sm text-slate-600 dark:text-slate-300">{label}</p>
    <p className="text-sm font-semibold text-slate-900 dark:text-white">
      <span className="font-normal text-slate-400 dark:text-slate-500">{before}</span>
      <ArrowRight className="mx-1.5 inline h-3.5 w-3.5 text-slate-400" />
      <span className={bad ? "text-red-500" : ""}>{after}</span>
    </p>
  </div>
);

const TABS = [
  { value: "chat", label: "Ask the coach", icon: MessageCircle },
  { value: "purchase", label: "Can I afford it?", icon: ShoppingBag },
];

const CoachPage = () => {
  const [tab, setTab] = useState("chat");
  const [formData, setFormData] = useState({ purchaseName: "", purchasePrice: "", reason: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.purchaseName.trim()) errs.purchaseName = "What are you thinking of buying?";
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
      errs.purchasePrice = "Enter an amount greater than 0";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning("Please fix the errors below");
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      const response = await checkAffordability({
        purchaseName: formData.purchaseName,
        purchasePrice: Number(formData.purchasePrice),
        reason: formData.reason || undefined,
      });
      setResult(response);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to analyze this purchase. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const recommendation = result?.analysis?.recommendation
    ? RECOMMENDATION_STYLES[result.analysis.recommendation]
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Coach</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Ask about your money, or check a purchase before you buy.
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            aria-pressed={tab === t.value}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer ${
              tab === t.value
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "chat" && (
        <div className="mt-4">
          <CoachChat />
        </div>
      )}

      {tab === "purchase" && (
      <>
      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">What are you considering?</label>
          <input
            type="text"
            name="purchaseName"
            value={formData.purchaseName}
            onChange={handleChange}
            placeholder="e.g. New laptop"
            maxLength={100}
            className={inputClass(errors.purchaseName)}
          />
          {errors.purchaseName && <p className="text-xs font-medium text-red-500">{errors.purchaseName}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price</label>
          <input
            type="number"
            name="purchasePrice"
            step="0.01"
            min="0.01"
            value={formData.purchasePrice}
            onChange={handleChange}
            placeholder="0.00"
            className={inputClass(errors.purchasePrice)}
          />
          {errors.purchasePrice && <p className="text-xs font-medium text-red-500">{errors.purchasePrice}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Why do you want it? (optional)
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={2}
            maxLength={300}
            placeholder="Gives the AI more context for its recommendation"
            className={`resize-none ${inputClass(false)}`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Analyzing..." : "Check affordability"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {recommendation && <recommendation.icon className="h-5 w-5 text-current" />}
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${recommendation?.badge}`}>
                  {recommendation?.label}
                </span>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${RISK_STYLES[result.analysis.risk_level]}`}>
                {result.analysis.risk_level} risk
              </span>
            </div>

            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{result.analysis.explanation}</p>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Suggested action
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{result.analysis.suggested_action}</p>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                How {money(result.purchase.price, result.currency)} affects your money
              </p>

              <div className="mt-3 flex flex-col gap-2">
                {result.budgetImpact ? (
                  <>
                    <ImpactRow
                      icon={Wallet}
                      label="Left in this month's budget"
                      before={money(result.budgetImpact.remainingBefore, result.currency)}
                      after={money(result.budgetImpact.remainingAfter, result.currency)}
                      bad={result.budgetImpact.remainingAfter < 0}
                    />
                    <ImpactRow
                      icon={CalendarDays}
                      label={`Safe to spend per day (${result.budgetImpact.daysLeft} day${result.budgetImpact.daysLeft === 1 ? "" : "s"} left)`}
                      before={money(result.budgetImpact.dailyBefore, result.currency)}
                      after={money(result.budgetImpact.dailyAfter, result.currency)}
                      bad={result.budgetImpact.dailyAfter <= 0}
                    />
                    <div className="px-1">
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-slate-400 dark:bg-slate-500"
                          style={{ width: `${Math.min(result.budgetImpact.percentUsedBefore, 100)}%` }}
                        />
                        <div
                          className={`h-full ${result.budgetImpact.percentUsedAfter > 100 ? "bg-red-500" : "bg-amber-400"}`}
                          style={{
                            width: `${Math.max(
                              Math.min(result.budgetImpact.percentUsedAfter, 100) -
                                Math.min(result.budgetImpact.percentUsedBefore, 100),
                              0
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                        Budget used: {Math.round(result.budgetImpact.percentUsedBefore)}% now,{" "}
                        {Math.round(result.budgetImpact.percentUsedAfter)}% after buying
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    You haven&apos;t set a budget for this month, so the coach used your income and spending instead.{" "}
                    <Link href="/dashboard/budgets" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                      Set a budget
                    </Link>{" "}
                    to see the exact effect.
                  </p>
                )}

                {result.goalImpact && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
                    <Target className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {result.goalImpact.notSaving ? (
                        <>
                          You aren&apos;t saving money each month right now, so this would come straight out of your
                          progress on <span className="font-semibold">{result.goalImpact.title}</span>.
                        </>
                      ) : (
                        <>
                          Paying from savings would push <span className="font-semibold">{result.goalImpact.title}</span>{" "}
                          back by <span className="font-semibold">{weeksLabel(result.goalImpact.delayWeeks)}</span>.
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-4">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Income this month</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {money(result.financialContext.monthlyIncome, result.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Spent this month</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {money(result.financialContext.monthlyExpenses, result.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Usually saved / month</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {(result.financialContext.typicalMonthlySavings ?? null) !== null
                    ? money(result.financialContext.typicalMonthlySavings, result.currency)
                    : "Not enough history"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Active goals</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {result.financialContext.activeGoals}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
};

export default CoachPage;
