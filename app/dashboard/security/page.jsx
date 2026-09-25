"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ShieldCheck, UserX, UserCheck } from "lucide-react";

import { getAllUsers, updateUserStatus } from "@/services/adminService";
import Skeleton from "@/components/Skeleton";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never";

const SecurityPage = () => {
  const [admins, setAdmins] = useState([]);
  const [deactivated, setDeactivated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [adminsRes, deactivatedRes] = await Promise.all([
        getAllUsers({ role: "admin", limit: 50 }),
        getAllUsers({ status: "inactive", limit: 50 }),
      ]);
      setAdmins(adminsRes.users);
      setDeactivated(deactivatedRes.users);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load security data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReactivate = async (targetUser) => {
    try {
      setActionLoadingId(targetUser._id);
      await updateUserStatus(targetUser._id, true);
      toast.success(`${targetUser.username} reactivated`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reactivate user");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Review who has admin access and which accounts are locked out.
      </p>

      {loading ? (
        <div className="mt-8 flex flex-col gap-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Admin accounts ({admins.length})</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Everyone with admin access can manage users and view platform-wide data.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {admins.map((a) => (
                <div key={a._id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5 dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{a.username}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{a.email}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-slate-400 dark:text-slate-500">
                    <p>Joined {formatDate(a.createdAt)}</p>
                    <p>Last login {formatDate(a.lastLoginAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Deactivated accounts ({deactivated.length})</h2>
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              These users are blocked from logging in until reactivated.
            </p>

            {deactivated.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">No deactivated accounts.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                {deactivated.map((u) => (
                  <div key={u._id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5 dark:border-slate-800">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{u.username}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                    </div>
                    <button
                      onClick={() => handleReactivate(u)}
                      disabled={actionLoadingId === u._id}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-emerald-500/10 cursor-pointer"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Reactivate
                    </button>
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

export default SecurityPage;
