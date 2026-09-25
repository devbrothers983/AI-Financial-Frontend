"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { TrendingUp, TrendingDown, UserPlus } from "lucide-react";

import { getAdminReports } from "@/services/adminService";
import TrendChart from "@/components/reports/TrendChart";
import Skeleton from "@/components/Skeleton";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState([]);
  const [topExpenseCategories, setTopExpenseCategories] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const response = await getAdminReports();
        setTrends(response.trends.map((t) => ({ ...t, netCashFlow: t.income - t.expenses })));
        setTopExpenseCategories(response.topExpenseCategories);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const totalIncome = trends.reduce((sum, t) => sum + t.income, 0);
  const totalExpenses = trends.reduce((sum, t) => sum + t.expenses, 0);
  const totalNewUsers = trends.reduce((sum, t) => sum + t.newUsers, 0);
  const maxNewUsers = Math.max(1, ...trends.map((t) => t.newUsers));
  const maxCategoryAmount = Math.max(1, ...topExpenseCategories.map((c) => c.totalAmount));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Platform-wide income, spending, and growth trends across all users.
      </p>

      {loading ? (
        <div className="mt-8 flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-medium">Income — last 6 months</span>
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-xs font-medium">Expenses — last 6 months</span>
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <UserPlus className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-medium">New users — last 6 months</span>
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{totalNewUsers}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
              Platform income vs. expenses — last 6 months
            </h2>
            {trends.length > 0 ? (
              <TrendChart trends={trends} />
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">Not enough data yet.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">User growth — last 6 months</h2>
            <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-800" style={{ height: 140 }}>
              {trends.map((t) => (
                <div key={`${t.year}-${t.month}`} className="group relative flex flex-1 flex-col items-center justify-end">
                  <div
                    className="w-6 rounded-t-[4px] bg-indigo-500 transition-all sm:w-8"
                    style={{ height: `${Math.max((t.newUsers / maxNewUsers) * 110, t.newUsers > 0 ? 4 : 0)}px` }}
                  />
                  <div className="pointer-events-none absolute bottom-full mb-1.5 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white group-hover:block dark:bg-slate-700">
                    {t.newUsers} new user{t.newUsers === 1 ? "" : "s"}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between gap-3">
              {trends.map((t) => (
                <div key={`${t.year}-${t.month}-label`} className="flex-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {t.monthName}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Top expense categories platform-wide</h2>
            {topExpenseCategories.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No expenses recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topExpenseCategories.map((c) => (
                  <div key={c.category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium capitalize text-slate-700 dark:text-slate-300">{c.category}</span>
                      <span className="text-slate-500 dark:text-slate-400">{formatCurrency(c.totalAmount)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${(c.totalAmount / maxCategoryAmount) * 100}%` }}
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

export default AdminReports;
