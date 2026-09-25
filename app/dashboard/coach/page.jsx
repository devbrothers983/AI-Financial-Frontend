"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ArrowRight, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { checkAffordability } from "@/services/coachService";

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

const CoachPage = () => {
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
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Coach</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Ask before you buy — get an instant read on whether it fits your budget.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
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

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-4">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Monthly income</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  ${result.financialContext.monthlyIncome.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Monthly expenses</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  ${result.financialContext.monthlyExpenses.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Savings rate</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {result.financialContext.savingsRate}%
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
    </div>
  );
};

export default CoachPage;
