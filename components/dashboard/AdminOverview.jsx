"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Users, UserCheck, ShieldCheck, UserPlus, TrendingUp, TrendingDown, Wallet, Target } from "lucide-react";
import Link from "next/link";

import { getAdminOverview } from "@/services/adminService";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import Skeleton from "@/components/Skeleton";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

const AdminOverview = () => {
  const { user, hydrated } = useSelector((state) => state.auth);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;

    const fetchOverview = async () => {
      try {
        setLoading(true);
        const response = await getAdminOverview();
        setOverview(response.overview);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load admin overview");
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [hydrated]);

  const showSkeleton = !hydrated || loading;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
        <span>Welcome back{hydrated ? "," : ""}</span>
        {hydrated ? <span>{user?.username || "there"} 👋</span> : <Skeleton className="h-6 w-32" />}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here&apos;s how the platform is doing this month.</p>

      {showSkeleton ? (
        <DashboardSkeleton />
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="mt-8 flex flex-col gap-8">
          <motion.div variants={container} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div variants={item} whileHover={{ y: -4 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Users className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">Total users</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{overview?.users?.total ?? 0}</p>
            </motion.div>

            <motion.div variants={item} whileHover={{ y: -4 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Active users</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{overview?.users?.active ?? 0}</p>
              {overview?.users?.inactive > 0 && (
                <p className="mt-1 text-xs text-red-500">{overview.users.inactive} deactivated</p>
              )}
            </motion.div>

            <motion.div variants={item} whileHover={{ y: -4 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <UserPlus className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">New this month</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{overview?.users?.newThisMonth ?? 0}</p>
            </motion.div>

            <motion.div variants={item} whileHover={{ y: -4 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Admins</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{overview?.users?.admins ?? 0}</p>
            </motion.div>
          </motion.div>

          <motion.div variants={item}>
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Platform activity this month</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium">Platform income</span>
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(overview?.platformFinances?.monthlyIncome)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium">Platform expenses</span>
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(overview?.platformFinances?.monthlyExpenses)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Wallet className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-medium">Total transactions</span>
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  {overview?.platformFinances?.totalTransactions ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Target className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium">Active goals</span>
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  {overview?.platformFinances?.totalActiveGoals ?? 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item}>
            <div className="flex items-center justify-between">
              <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Recent signups</h2>
              <Link href="/dashboard/users" className="mb-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                View all users
              </Link>
            </div>
            {overview?.recentSignups?.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Username</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {overview.recentSignups.map((u) => (
                      <tr key={u._id}>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{u.username}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${u.role === "admin" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                No signups yet.
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminOverview;
