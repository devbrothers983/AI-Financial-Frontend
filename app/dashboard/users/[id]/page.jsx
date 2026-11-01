"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ShieldCheck,
  Shield,
  UserX,
  UserCheck,
  Trash2,
  Receipt,
  Activity,
  UserPlus,
  LogIn,
  Wallet,
  Target,
  Trophy,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  ShieldAlert,
  KeyRound,
  UserCog,
  Pencil,
  Download,
} from "lucide-react";
import { downloadFromApi } from "@/lib/download";

import {
  getUserById,
  getUserTransactions,
  getUserActivityTimeline,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from "@/services/adminService";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/Skeleton";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never";

const formatTime = (value) => new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const formatMoney = (amount, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  }
};

const humanize = (value) => (value ? value.replace(/_/g, " ") : "");

// "Today", "Yesterday", or a full date, used as the timeline's day headings
const dayLabel = (value) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
};

const ACTIVITY_FILTERS = [
  { value: "", label: "All activity" },
  { value: "transaction", label: "Transactions", countKey: "transactionCount" },
  { value: "budget", label: "Budgets", countKey: "budgetCount" },
  { value: "goal", label: "Goals", countKey: "goalCount" },
  { value: "message", label: "Messages", countKey: "messageCount" },
  { value: "account", label: "Sign-ins & account" },
  { value: "admin", label: "Admin actions" },
];

const EVENT_STYLE = {
  "transaction:income": { icon: ArrowDownLeft, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
  "transaction:expense": { icon: ArrowUpRight, tone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
  "budget:created": { icon: Wallet, tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" },
  "goal:created": { icon: Target, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  "goal:completed": { icon: Trophy, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  "message:contact": { icon: MessageSquare, tone: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" },
  "message:feedback": { icon: MessageSquare, tone: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" },
  "account:signup": { icon: UserPlus, tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" },
  "account:login": { icon: LogIn, tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" },
  "account:login_failed": { icon: ShieldAlert, tone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
  "account:login_blocked": { icon: ShieldAlert, tone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
  "account:password_reset": { icon: KeyRound, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  "account:password_change": { icon: KeyRound, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
};

// Fallbacks by type, for edits/deletes and anything not listed above
const TYPE_STYLE = {
  transaction: { icon: Receipt, tone: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  budget: EVENT_STYLE["budget:created"],
  goal: EVENT_STYLE["goal:created"],
  message: EVENT_STYLE["message:contact"],
  account: { icon: UserCog, tone: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  admin: { icon: ShieldCheck, tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" },
};

const DEFAULT_STYLE = { icon: Activity, tone: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" };

const DELETE_STYLE_TONE = "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400";

const getEventStyle = (e) => {
  const exact = EVENT_STYLE[`${e.type}:${e.action}`];
  if (exact) return exact;
  const base = TYPE_STYLE[e.type] || DEFAULT_STYLE;
  if (e.action === "delete" || e.action === "user_delete") return { icon: Trash2, tone: DELETE_STYLE_TONE };
  if (e.action === "update") return { ...base, icon: Pencil };
  return base;
};

const Chip = ({ children, className = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" }) => (
  <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium capitalize ${className}`}>{children}</span>
);

// Who / where chips from the activity log (admin name, device, IP)
const SourceChips = ({ meta = {} }) => (
  <>
    {meta.by && <Chip className="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">By {meta.by}</Chip>}
    {meta.device && <Chip>{meta.device}</Chip>}
    {meta.ip && <Chip className="bg-slate-100 font-mono normal-case text-slate-500 dark:bg-slate-800 dark:text-slate-400">{meta.ip}</Chip>}
  </>
);

// Small detail chips under each timeline entry, depending on its type
const EventChips = ({ event }) => {
  const m = event.meta || {};
  if (m.by || m.device || m.ip) return <SourceChips meta={m} />;
  if (event.type === "transaction") {
    return (
      <>
        <Chip>{m.category}</Chip>
        {m.paymentMethod && <Chip>{humanize(m.paymentMethod)}</Chip>}
        {m.recurring && <Chip className="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">Recurring</Chip>}
        {m.transactionDate && <Chip>Dated {formatDate(m.transactionDate)}</Chip>}
      </>
    );
  }
  if (event.type === "budget") {
    return <Chip>{m.categoryCount} {m.categoryCount === 1 ? "category" : "categories"}</Chip>;
  }
  if (event.type === "goal" && event.action === "created") {
    return (
      <>
        {m.priority && <Chip>{m.priority} priority</Chip>}
        {m.targetDate && <Chip>Due {formatDate(m.targetDate)}</Chip>}
      </>
    );
  }
  if (event.type === "message") {
    return m.replied ? (
      <Chip className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">Replied</Chip>
    ) : (
      <Chip className="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">Awaiting reply</Chip>
    );
  }
  return null;
};

const tabClass = (active) =>
  `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer ${
    active
      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
  }`;

const StatTile = ({ label, value, tone = "text-slate-900 dark:text-white" }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className={`mt-1 truncate text-lg font-semibold ${tone}`}>{value}</p>
  </div>
);

const ListSkeleton = () => (
  <div className="flex flex-col gap-2">
    {[0, 1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-16 w-full rounded-xl" />
    ))}
  </div>
);

const EmptyState = ({ children }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
    {children}
  </div>
);

const UserDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("activity");

  const [transactions, setTransactions] = useState([]);
  const [txPagination, setTxPagination] = useState(null);
  const [txPage, setTxPage] = useState(1);
  const [txType, setTxType] = useState("");
  const [txLoading, setTxLoading] = useState(true);

  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState("");
  const [eventsLoading, setEventsLoading] = useState(true);

  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const response = await getUserById(id);
      setUser(response.user);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTransactions = useCallback(async () => {
    try {
      setTxLoading(true);
      const params = { page: txPage, limit: 15 };
      if (txType) params.type = txType;
      const response = await getUserTransactions(id, params);
      setTransactions(response.transactions);
      setTxPagination(response.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load transactions");
    } finally {
      setTxLoading(false);
    }
  }, [id, txPage, txType]);

  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const response = await getUserActivityTimeline(id, eventFilter ? { type: eventFilter } : undefined);
      setEvents(response.events);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load activity");
    } finally {
      setEventsLoading(false);
    }
  }, [id, eventFilter]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Group timeline entries under day headings, newest first
  const eventGroups = useMemo(() => {
    const groups = [];
    for (const e of events) {
      const label = dayLabel(e.timestamp);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(e);
      else groups.push({ label, items: [e] });
    }
    return groups;
  }, [events]);

  const isSelf = user?.email === currentUser?.email;
  const currency = user?.currency || "USD";

  const handleRoleToggle = async () => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    try {
      await updateUserRole(user._id, nextRole);
      toast.success(`${user.username} is now ${nextRole === "admin" ? "an admin" : "a regular user"}`);
      setUser((prev) => ({ ...prev, role: nextRole }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleStatusConfirm = async () => {
    try {
      setActionLoading(true);
      const nextActive = !user.isActive;
      await updateUserStatus(user._id, nextActive);
      toast.success(`${user.username} ${nextActive ? "reactivated" : "deactivated"}`);
      setUser((prev) => ({ ...prev, isActive: nextActive }));
      setStatusOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      await deleteUser(user._id);
      toast.success(`${user.username} deleted`);
      router.push("/dashboard/users");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="mt-6 h-32 w-full rounded-2xl" />
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">This user could not be found.</p>
        <Link href="/dashboard/users" className="mt-4 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400">
          Back to users
        </Link>
      </div>
    );
  }

  const actionButton =
    "flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/dashboard/users"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      {/* Profile + actions */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xl font-semibold uppercase text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                {user.username?.[0]}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white">
                {user.username} {isSelf && <span className="text-sm font-normal text-slate-400">(you)</span>}
              </h1>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                    user.role === "admin"
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {user.role}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    user.isActive
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                  }`}
                >
                  {user.isActive ? "Active" : "Deactivated"}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {user.authProvider === "google" ? "Google sign-in" : "Email sign-in"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              onClick={handleRoleToggle}
              disabled={isSelf}
              className={`${actionButton} text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400`}
            >
              {user.role === "admin" ? <Shield className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {user.role === "admin" ? "Make user" : "Make admin"}
            </button>
            <button
              onClick={() => setStatusOpen(true)}
              disabled={isSelf}
              className={`${actionButton} text-slate-600 hover:bg-amber-50 hover:text-amber-600 dark:text-slate-300 dark:hover:bg-amber-500/10 dark:hover:text-amber-400`}
            >
              {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              {user.isActive ? "Deactivate" : "Reactivate"}
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              disabled={isSelf}
              className={`${actionButton} text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10`}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span>Joined {formatDate(user.createdAt)}</span>
          <span>Last login {formatDate(user.lastLoginAt)}</span>
          <span>Currency {currency}</span>
          <span>Onboarding {user.onboardingCompleted ? "completed" : "not completed"}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Total income" value={formatMoney(user.stats?.totalIncome, currency)} tone="text-emerald-600 dark:text-emerald-400" />
        <StatTile label="Total expenses" value={formatMoney(user.stats?.totalExpense, currency)} tone="text-red-500 dark:text-red-400" />
        <StatTile label="Transactions" value={user.stats?.transactionCount ?? 0} />
        <StatTile label="Budgets" value={user.stats?.budgetCount ?? 0} />
        <StatTile label="Goals" value={user.stats?.goalCount ?? 0} />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setTab("activity")} className={tabClass(tab === "activity")}>
          <Activity className="h-4 w-4" /> Activity
        </button>
        <button onClick={() => setTab("transactions")} className={tabClass(tab === "transactions")}>
          <Receipt className="h-4 w-4" /> Transactions
        </button>
        <button onClick={() => setTab("plans")} className={tabClass(tab === "plans")}>
          <PieChart className="h-4 w-4" /> Budgets &amp; Goals
        </button>
      </div>

      {tab === "activity" && (
        <div className="mt-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ACTIVITY_FILTERS.map((f) => {
              const count = f.countKey ? user.stats?.[f.countKey] : null;
              return (
                <button
                  key={f.value}
                  onClick={() => setEventFilter(f.value)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    eventFilter === f.value
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  {f.label}
                  {count != null && (
                    <span className={`rounded-full px-1.5 text-[10px] ${eventFilter === f.value ? "bg-white/20" : "bg-white dark:bg-slate-900"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            {eventsLoading ? (
              <ListSkeleton />
            ) : events.length === 0 ? (
              <EmptyState>No activity of this type yet.</EmptyState>
            ) : (
              <div className="flex flex-col gap-6">
                {eventGroups.map((group) => (
                  <section key={group.label}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {group.label}
                    </h3>
                    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                      {group.items.map((e, i) => {
                        const style = getEventStyle(e);
                        const Icon = style.icon;
                        const amountTone =
                          e.action === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : e.action === "expense"
                              ? "text-red-500 dark:text-red-400"
                              : "text-slate-700 dark:text-slate-300";
                        return (
                          <li key={`${e.type}-${e.action}-${e.timestamp}-${i}`} className="flex gap-3 px-4 py-3">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.tone}`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{e.title}</p>
                                {e.amount != null && (
                                  <span className={`shrink-0 text-sm font-semibold ${amountTone}`}>
                                    {e.action === "income" ? "+" : e.action === "expense" ? "−" : ""}
                                    {formatMoney(e.amount, currency)}
                                  </span>
                                )}
                              </div>
                              {e.detail && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{e.detail}</p>}
                              {e.meta?.preview && (
                                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">“{e.meta.preview}”</p>
                              )}
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <span className="text-xs text-slate-400 dark:text-slate-500">{formatTime(e.timestamp)}</span>
                                <EventChips event={e} />
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "transactions" && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <select
              value={txType}
              onChange={(e) => {
                setTxType(e.target.value);
                setTxPage(1);
              }}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <button
              onClick={async () => {
                try {
                  await downloadFromApi(`/admin/users/${user._id}/transactions/export`, undefined, "transactions.csv");
                } catch {
                  toast.error("Failed to export transactions");
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>

          <div className="mt-4">
            {txLoading ? (
              <ListSkeleton />
            ) : transactions.length === 0 ? (
              <EmptyState>No transactions yet.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {transactions.map((t) => {
                  const isIncome = t.transactionType === "income";
                  return (
                    <li key={t._id} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isIncome
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
                        }`}
                      >
                        {isIncome ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium capitalize text-slate-900 dark:text-white">
                          {t.description || t.transactionCategory}
                        </p>
                        <p className="truncate text-xs capitalize text-slate-500 dark:text-slate-400">
                          {t.transactionCategory} · {humanize(t.paymentMethod)} · {formatDate(t.transactionDate)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold ${
                          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                        }`}
                      >
                        {isIncome ? "+" : "−"}
                        {formatMoney(t.transactionAmount, currency)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {txPagination && txPagination.totalPages > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span>
                  Page {txPagination.currentPage} of {txPagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTxPage((p) => Math.max(p - 1, 1))}
                    disabled={txPagination.currentPage <= 1}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setTxPage((p) => Math.min(p + 1, txPagination.totalPages))}
                    disabled={txPagination.currentPage >= txPagination.totalPages}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "plans" && (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Budgets</h3>
            {!user.budgets?.length ? (
              <EmptyState>No budgets set.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {user.budgets.map((b) => (
                  <li key={b._id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {new Date(Date.UTC(b.year, b.month - 1, 1)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
                      </p>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatMoney(b.totalBudget, currency)}</span>
                    </div>
                    {b.categories?.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {b.categories.map((c) => (
                          <Chip key={c._id || c.category}>
                            {c.category} · {formatMoney(c.limit, currency)}
                          </Chip>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Goals</h3>
            {!user.goals?.length ? (
              <EmptyState>No goals created.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {user.goals.map((g) => {
                  const progress = Math.min(Math.round(((g.currentAmount || 0) / g.targetAmount) * 100), 100);
                  return (
                    <li key={g._id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{g.title}</p>
                        <Chip
                          className={
                            g.status === "completed"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : g.status === "paused"
                                ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                          }
                        >
                          {g.status}
                        </Chip>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          {formatMoney(g.currentAmount, currency)} of {formatMoney(g.targetAmount, currency)} ({progress}%)
                        </span>
                        <span>Due {formatDate(g.targetDate)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={handleStatusConfirm}
        loading={actionLoading}
        loadingLabel="Saving..."
        title={user.isActive ? "Deactivate user?" : "Reactivate user?"}
        description={
          user.isActive
            ? `${user.username} will be immediately signed out and won't be able to log back in until reactivated.`
            : `${user.username} will be able to log in again.`
        }
        confirmLabel={user.isActive ? "Deactivate" : "Reactivate"}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading}
        title="Delete user?"
        description={`This will permanently delete ${user.username} and all of their transactions, budgets, and goals. This cannot be undone.`}
      />
    </div>
  );
};

export default UserDetailPage;
