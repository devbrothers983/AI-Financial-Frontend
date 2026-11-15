"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Repeat,
  Receipt,
  Banknote,
  Bell,
  BellOff,
  Loader2,
} from "lucide-react";

import {
  getBills,
  deleteBill,
  markBillPaid,
  getBillCalendar,
  announceCashflowChange,
  CASHFLOW_UPDATED_EVENT,
} from "@/services/cashflowService";
import SafeToSpendCard from "@/components/cashflow/SafeToSpendCard";
import BillFormModal from "@/components/cashflow/BillFormModal";
import PayPlanModal from "@/components/cashflow/PayPlanModal";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/Skeleton";
import { money, shortDate, longDate, whenLabel, daysFromToday, BILL_FREQUENCY_LABEL } from "@/components/cashflow/format";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const KIND_STYLE = {
  bill: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300", icon: Receipt, label: "Bill" },
  subscription: { dot: "bg-indigo-500", chip: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300", icon: Repeat, label: "Subscription" },
  payday: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300", icon: Banknote, label: "Payday" },
};

const actionClass =
  "flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer";

const todayParts = () => {
  const now = new Date();
  return { month: now.getUTCMonth() + 1, year: now.getUTCFullYear() };
};

const monthTitle = (month, year) =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

const dayKey = (value) => new Date(value).toISOString().slice(0, 10);

// ---- Month grid ----
const Calendar = ({ month, year, events, selected, onSelect }) => {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const blanks = first.getUTCDay();
  const todayKey = dayKey(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())));

  const byDay = useMemo(() => {
    const map = new Map();
    events.forEach((e) => {
      const key = dayKey(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    return map;
  }, [events]);

  const cells = [...Array(blanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            <span className="sm:hidden">{d[0]}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />;
          const key = dayKey(new Date(Date.UTC(year, month - 1, day)));
          const dayEvents = byDay.get(key) || [];
          const spend = dayEvents.filter((e) => e.kind !== "payday").reduce((s, e) => s + e.amount, 0);
          const isToday = key === todayKey;
          const isPast = key < todayKey;
          const isSelected = key === selected;

          return (
            <button
              key={key}
              onClick={() => onSelect(isSelected ? null : key)}
              disabled={dayEvents.length === 0}
              aria-label={`${key}: ${dayEvents.length} item${dayEvents.length === 1 ? "" : "s"}`}
              className={`flex min-h-14 flex-col items-center rounded-lg border p-1 text-xs transition-colors sm:min-h-20 sm:items-start sm:p-1.5 ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                  : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              } ${dayEvents.length ? "cursor-pointer" : "cursor-default"} ${isPast ? "opacity-40" : ""}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  isToday ? "bg-emerald-600 text-white" : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {day}
              </span>
              {dayEvents.length > 0 && (
                <>
                  <span className="mt-1 flex gap-0.5">
                    {[...new Set(dayEvents.map((e) => e.kind))].map((kind) => (
                      <span key={kind} className={`h-1.5 w-1.5 rounded-full ${KIND_STYLE[kind].dot}`} />
                    ))}
                  </span>
                  {spend > 0 && (
                    <span className="mt-0.5 hidden truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:block">
                      {money(spend)}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {Object.entries(KIND_STYLE).map(([kind, style]) => (
          <span key={kind} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${style.dot}`} /> {style.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const BillsPage = () => {
  const { isAuthenticated, hydrated } = useSelector((state) => state.auth);
  const currency = useSelector((state) => state.auth.user?.currency) || "USD";

  const [bills, setBills] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState(todayParts);
  const [calendar, setCalendar] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paying, setPaying] = useState(null);
  const [addExpense, setAddExpense] = useState(true);
  const [payBusy, setPayBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadBills = useCallback(async () => {
    try {
      const response = await getBills();
      setBills(response.bills);
      setSubscriptions(response.subscriptions);
      setSummary(response.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't load your bills");
      setBills([]);
    }
  }, []);

  const loadCalendar = useCallback(async () => {
    try {
      const response = await getBillCalendar(period.month, period.year);
      setCalendar(response);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't load the calendar");
    }
  }, [period]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    const timer = setTimeout(loadBills, 0);
    window.addEventListener(CASHFLOW_UPDATED_EVENT, loadBills);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(CASHFLOW_UPDATED_EVENT, loadBills);
    };
  }, [hydrated, isAuthenticated, loadBills]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    const timer = setTimeout(loadCalendar, 0);
    window.addEventListener(CASHFLOW_UPDATED_EVENT, loadCalendar);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(CASHFLOW_UPDATED_EVENT, loadCalendar);
    };
  }, [hydrated, isAuthenticated, loadCalendar]);

  const thisMonth = todayParts();
  const isThisMonth = period.month === thisMonth.month && period.year === thisMonth.year;
  const maxMonth = new Date(Date.UTC(thisMonth.year, thisMonth.month - 1 + 12, 1));
  const atMax = period.year === maxMonth.getUTCFullYear() && period.month === maxMonth.getUTCMonth() + 1;

  const shiftMonth = (delta) => {
    const d = new Date(Date.UTC(period.year, period.month - 1 + delta, 1));
    setSelectedDay(null);
    setCalendar(null);
    setPeriod({ month: d.getUTCMonth() + 1, year: d.getUTCFullYear() });
  };

  const events = calendar?.events || [];
  const shownEvents = selectedDay ? events.filter((e) => dayKey(e.date) === selectedDay) : events;

  const confirmPaid = async () => {
    try {
      setPayBusy(true);
      const response = await markBillPaid(paying._id, addExpense);
      toast.success(response.message);
      setPaying(null);
      announceCashflowChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't mark it as paid");
    } finally {
      setPayBusy(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleteBusy(true);
      const response = await deleteBill(deleting._id);
      toast.success(response.message);
      setDeleting(null);
      announceCashflowChange();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't remove this bill");
    } finally {
      setDeleteBusy(false);
    }
  };

  if (hydrated && !isAuthenticated) return null;

  const activeBills = (bills || []).filter((b) => b.status === "active");
  const paidBills = (bills || []).filter((b) => b.status === "paid");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bills & calendar</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Every bill, subscription and payday in one place, so nothing comes as a surprise.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSettingsOpen(true)} className={actionClass}>
            <Settings2 className="h-4 w-4" /> Pay & balance
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add bill
          </button>
        </div>
      </div>

      <div className="mt-6">
        <SafeToSpendCard compact />
      </div>

      {/* ---- Calendar ---- */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Calendar</h2>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1 py-0.5 dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => shiftMonth(-1)}
              disabled={isThisMonth}
              aria-label="Previous month"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-32 text-center text-sm font-medium text-slate-700 dark:text-slate-200">
              {monthTitle(period.month, period.year)}
            </span>
            <button
              onClick={() => shiftMonth(1)}
              disabled={atMax}
              aria-label="Next month"
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {calendar ? (
            <Calendar month={period.month} year={period.year} events={events} selected={selectedDay} onSelect={setSelectedDay} />
          ) : (
            <Skeleton className="h-80 w-full rounded-2xl" />
          )}

          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {selectedDay ? longDate(`${selectedDay}T00:00:00Z`) : isThisMonth ? "Still to come this month" : "This month"}
              </p>
              {selectedDay ? (
                <button onClick={() => setSelectedDay(null)} className="text-xs font-medium text-emerald-600 hover:underline cursor-pointer">
                  Show all
                </button>
              ) : (
                calendar && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">{money(calendar.totals?.bills, currency)} due</span>
                )
              )}
            </div>
            {!calendar ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : shownEvents.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">Nothing due this month.</p>
            ) : (
              <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {shownEvents.map((e, i) => {
                  const style = KIND_STYLE[e.kind];
                  return (
                    <li key={`${e.kind}-${e.id || "pay"}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.chip}`}>
                        <style.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{e.name}</p>
                        <p className={`text-xs ${e.overdue ? "font-semibold text-red-500" : "text-slate-500 dark:text-slate-400"}`}>
                          {shortDate(e.date)} · {whenLabel(e.date)}
                        </p>
                      </div>
                      {e.amount ? (
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            e.kind === "payday" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {e.kind === "payday" ? "+" : ""}
                          {money(e.amount, currency)}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
            {calendar && calendar.paydaySource !== "you" && calendar.paydaySource !== "detected" && (
              <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Paydays aren&apos;t shown yet.{" "}
                <button onClick={() => setSettingsOpen(true)} className="font-semibold text-emerald-600 hover:underline cursor-pointer">
                  Set your payday
                </button>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ---- Bills list ---- */}
      <section className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Your bills</h2>
          {summary && summary.count > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              About {money(summary.monthlyTotal, currency)} a month
              {summary.subscriptionsMonthly > 0 && ` + ${money(summary.subscriptionsMonthly, currency)} in subscriptions`}
            </p>
          )}
        </div>

        {bills === null ? (
          <div className="mt-3 flex flex-col gap-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : activeBills.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <Receipt className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">No bills yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add rent, electricity, your phone plan and other bills to see what&apos;s really safe to spend.
            </p>
            <button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add your first bill
            </button>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {activeBills.map((bill) => {
              const days = daysFromToday(bill.nextDueDate);
              const soon = days <= 3;
              return (
                <li key={bill._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                      {bill.name}
                      {bill.remindDaysBefore > 0 ? (
                        <Bell className="h-3.5 w-3.5 text-slate-400" aria-label="Reminder on" />
                      ) : (
                        <BellOff className="h-3.5 w-3.5 text-slate-300" aria-label="Reminder off" />
                      )}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {BILL_FREQUENCY_LABEL[bill.frequency]} ·{" "}
                      <span className={days < 0 ? "font-semibold text-red-500" : soon ? "font-semibold text-amber-600 dark:text-amber-400" : ""}>
                        {days < 0 ? "Overdue" : "Due"} {shortDate(bill.nextDueDate)} ({whenLabel(bill.nextDueDate).toLowerCase()})
                      </span>
                    </p>
                  </div>
                  <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">{money(bill.amount, currency)}</p>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      onClick={() => {
                        setAddExpense(true);
                        setPaying(bill);
                      }}
                      className={`${actionClass} border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                    </button>
                    <button
                      onClick={() => {
                        setEditing(bill);
                        setFormOpen(true);
                      }}
                      className={actionClass}
                      aria-label={`Edit ${bill.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => setDeleting(bill)} className={actionClass} aria-label={`Remove ${bill.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {paidBills.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-slate-500 dark:text-slate-400">Paid one-time bills ({paidBills.length})</summary>
            <ul className="mt-2 flex flex-col gap-1 text-slate-500 dark:text-slate-400">
              {paidBills.map((bill) => (
                <li key={bill._id} className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                  <span>
                    {bill.name} · paid {bill.lastPaidAt ? shortDate(bill.lastPaidAt) : ""}
                  </span>
                  <span className="flex items-center gap-3">
                    {money(bill.amount, currency)}
                    <button onClick={() => setDeleting(bill)} aria-label={`Remove ${bill.name}`} className="hover:text-red-500 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* ---- Subscriptions, counted automatically ---- */}
      {subscriptions.length > 0 && (
        <section className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Subscriptions</h2>
            <Link href="/dashboard/subscriptions" className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400">
              Manage subscriptions
            </Link>
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Counted in your calendar and safe-to-spend automatically.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {subscriptions.map((s) => (
              <span
                key={s._id}
                className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
              >
                <Repeat className="h-3 w-3" /> {s.name} · {money(s.amount, currency)} · {shortDate(s.nextChargeDate)}
              </span>
            ))}
          </div>
        </section>
      )}

      <BillFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => {}} bill={editing} />
      <PayPlanModal open={settingsOpen} onClose={() => setSettingsOpen(false)} currency={currency} />

      <Modal open={Boolean(paying)} onClose={() => setPaying(null)} title={paying ? `Mark ${paying.name} as paid` : ""}>
        {paying && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {money(paying.amount, currency)}
              {paying.frequency === "once" ? "." : `. It'll move to the next due date, ${BILL_FREQUENCY_LABEL[paying.frequency].toLowerCase()}.`}
            </p>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={addExpense}
                onChange={(e) => setAddExpense(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-emerald-600"
              />
              <span>
                Also add it to Transactions as an expense
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  Turn this off if your bank is connected, because the payment will be imported anyway.
                </span>
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPaying(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmPaid}
                disabled={payBusy}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
              >
                {payBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Mark as paid
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteBusy}
        title={deleting ? `Remove ${deleting.name}?` : ""}
        description="It'll no longer show in your calendar or count toward what's safe to spend. Past transactions stay."
        confirmLabel="Remove"
        loadingLabel="Removing..."
      />
    </div>
  );
};

export default BillsPage;
