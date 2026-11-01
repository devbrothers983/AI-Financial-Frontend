"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { ShieldCheck, LogIn, ShieldAlert, KeyRound, LogOut, Loader2, MonitorSmartphone } from "lucide-react";

import { getLoginHistory, logoutAllDevices } from "@/services/userService";
import { setToken } from "@/slices/authSlice";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/Skeleton";

const EVENT_STYLES = {
  "auth.login": { icon: LogIn, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
  "auth.login_failed": { icon: ShieldAlert, tone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
  "auth.login_blocked": { icon: ShieldAlert, tone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
  "auth.password_reset": { icon: KeyRound, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  "profile.password_change": { icon: KeyRound, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  "auth.logout_all": { icon: LogOut, tone: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

// Settings card: recent sign-ins / security events and "sign out everywhere"
const SecuritySection = () => {
  const dispatch = useDispatch();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await getLoginHistory();
      setHistory(response.history);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load sign-in history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLogoutAll = async () => {
    try {
      setSigningOut(true);
      const response = await logoutAllDevices();
      dispatch(setToken(response.token));
      toast.success("Signed out of all other devices");
      setConfirmOpen(false);
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to sign out other devices");
    } finally {
      setSigningOut(false);
    }
  };

  const failedCount = history.filter((h) => h.action === "auth.login_failed" || h.action === "auth.login_blocked").length;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Sign-in activity
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Recent sign-ins and security changes on your account. Don&apos;t recognise something? Change your password and sign out
            everywhere.
          </p>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
        >
          <LogOut className="h-4 w-4" /> Sign out of all other devices
        </button>
      </div>

      {failedCount > 0 && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {failedCount} failed or blocked sign-in {failedCount === 1 ? "attempt" : "attempts"} in your recent history.
        </p>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">No sign-in activity recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {history.map((h) => {
            const style = EVENT_STYLES[h.action] || { icon: MonitorSmartphone, tone: EVENT_STYLES["auth.logout_all"].tone };
            const Icon = style.icon;
            return (
              <li key={h._id} className="flex items-start gap-3 py-2.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                    {h.description}
                    {h.isCurrent && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {[h.device, h.ip, formatDateTime(h.createdAt)].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleLogoutAll}
        loading={signingOut}
        loadingLabel="Signing out..."
        confirmLabel="Sign out others"
        title="Sign out of all other devices?"
        description="Every other browser or phone signed in to your account will be signed out right away. You'll stay signed in here."
      />
    </div>
  );
};

export default SecuritySection;
