"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

import { getDashboardOverview } from "@/services/dashboardService";
import GoalCard from "@/components/GoalCard";
import TransactionTable from "@/components/TransactionTable";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import Skeleton from "@/components/Skeleton";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

const BUDGET_STATUS_STYLES = {
  safe: { bar: "from-emerald-400 to-emerald-500", badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", label: "On track" },
  warning: { bar: "from-amber-400 to-amber-500", badge: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", label: "Near limit" },
  over_budget: { bar: "from-red-400 to-red-500", badge: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400", label: "Over budget" },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const UserOverview = () => {
  const { user, isAuthenticated, hydrated } = useSelector((state) => state.auth);

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;

    const fetchOverview = async () => {
      try {
        setLoading(true);
        const response = await getDashboardOverview();
        setDashboard(response.dashboard);
      } catch (err) {
        const message = err.response?.data?.message || "Failed to load dashboard data";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [hydrated, isAuthenticated]);

  if (hydrated && !isAuthenticated) return null;

  const showSkeleton = !hydrated || loading;
  const budgetStyle = dashboard?.budget
    ? BUDGET_STATUS_STYLES[dashboard.budget.status] || BUDGET_STATUS_STYLES.safe
    : null;

  return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
          <span>Welcome back{hydrated ? "," : ""}</span>
          {hydrated ? <span>{user?.username || "there"} 👋</span> : <Skeleton className="h-6 w-32" />}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here&apos;s your financial snapshot for this month.</p>

        {showSkeleton ? (
          <DashboardSkeleton />
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-col gap-8"
          >
            <motion.div variants={container} className="grid gap-5 sm:grid-cols-3">
              <motion.div
                variants={item}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/20"
              >
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Income</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(dashboard?.finances?.totalIncome)}
                </p>
              </motion.div>

              <motion.div
                variants={item}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/20"
              >
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Expenses</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(dashboard?.finances?.totalExpenses)}
                </p>
              </motion.div>

              <motion.div
                variants={item}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/20"
              >
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Wallet className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium">Net cash flow</span>
                </div>
                <p className={`mt-2 text-2xl font-bold ${dashboard?.finances?.netCashFlow < 0 ? "text-red-500" : "text-slate-900 dark:text-white"}`}>
                  {formatCurrency(dashboard?.finances?.netCashFlow)}
                </p>
              </motion.div>
            </motion.div>

            <motion.div variants={item}>
              <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">This month&apos;s budget</h2>
              {dashboard?.budget ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatCurrency(dashboard.budget.totalSpent)} of {formatCurrency(dashboard.budget.totalBudget)} spent
                    </p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${budgetStyle.badge}`}>
                      {budgetStyle.label}
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(dashboard.budget.percentageUsed, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                      className={`h-full rounded-full bg-gradient-to-r ${budgetStyle.bar}`}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    {formatCurrency(dashboard.budget.remainingBudget)} remaining
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                  No budget set for this month yet.
                </div>
              )}
            </motion.div>

            <motion.div variants={item}>
              <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Active goals</h2>
              {dashboard?.activeGoals?.length > 0 ? (
                <motion.div variants={container} className="grid gap-4 sm:grid-cols-2">
                  {dashboard.activeGoals.map((goal) => (
                    <motion.div key={goal._id} variants={item} whileHover={{ y: -4 }}>
                      <GoalCard goal={goal} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                  No active goals yet.
                </div>
              )}
            </motion.div>

            <motion.div variants={item}>
              <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Recent transactions</h2>
              <TransactionTable transactions={dashboard?.recentTransactions || []} />
            </motion.div>
          </motion.div>
        )}
      </div>
  );
};

export default UserOverview;
