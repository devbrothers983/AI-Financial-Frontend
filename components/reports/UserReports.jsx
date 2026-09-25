"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

import { getMonthlyTrends, getSavingsRate } from "@/services/dashboardService";
import { getTransactionSummary, getCategoryBreakdown } from "@/services/transactionService";
import TrendChart from "@/components/reports/TrendChart";
import Skeleton from "@/components/Skeleton";

const SAVINGS_STATUS_STYLES = {
  good: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  moderate: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  low: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  negative: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

const UserReports = () => {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState([]);
  const [savings, setSavings] = useState(null);
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [trendsRes, savingsRes, summaryRes, breakdownRes] = await Promise.all([
          getMonthlyTrends(),
          getSavingsRate(),
          getTransactionSummary(),
          getCategoryBreakdown(),
        ]);
        setTrends(trendsRes.trends);
        setSavings(savingsRes.savings);
        setSummary(summaryRes.summary);
        setBreakdown(breakdownRes.breakdown);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const maxCategoryAmount = Math.max(1, ...breakdown.map((b) => b.totalAmount));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        A closer look at your income, spending, and savings over time.
      </p>

      {loading ? (
        <div className="mt-8 flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {/* Stat tiles */}
          <div className="grid gap-5 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-medium">This month income</span>
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summary?.totalIncome)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-xs font-medium">This month expenses</span>
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summary?.totalExpenses)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Wallet className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-medium">Net cash flow</span>
              </div>
              <p
                className={`mt-2 text-xl font-bold ${
                  summary?.netCashFlow < 0 ? "text-red-500" : "text-slate-900 dark:text-white"
                }`}
              >
                {formatCurrency(summary?.netCashFlow)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <PiggyBank className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium">Savings rate</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xl font-bold text-slate-900 dark:text-white">{savings?.savingsRate ?? 0}%</p>
                {savings?.status && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                      SAVINGS_STATUS_STYLES[savings.status] || SAVINGS_STATUS_STYLES.low
                    }`}
                  >
                    {savings.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Trend chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
              Income vs. expenses — last 6 months
            </h2>
            {trends.length > 0 ? (
              <TrendChart trends={trends} />
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">Not enough data yet.</p>
            )}
          </div>

          {/* Category breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Where your money goes</h2>
            {breakdown.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No expenses recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {breakdown.map((item) => (
                  <div key={item._id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-slate-700 dark:text-slate-300">{item._id}</span>
                      <span className="text-slate-500 dark:text-slate-400">{formatCurrency(item.totalAmount)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(item.totalAmount / maxCategoryAmount) * 100}%`,
                          backgroundColor: "#4f46e5",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReports;
