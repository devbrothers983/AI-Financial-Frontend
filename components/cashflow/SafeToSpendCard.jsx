"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Wallet, ChevronDown, CalendarDays, Settings2, AlertOctagon, Landmark, Sparkles } from "lucide-react";

import { getSafeToSpend, CASHFLOW_UPDATED_EVENT } from "@/services/cashflowService";
import Skeleton from "@/components/Skeleton";
import PayPlanModal from "./PayPlanModal";
import { money, shortDate, longDate, whenLabel } from "./format";

const TONES = {
  ok: {
    box: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    big: "text-emerald-700 dark:text-emerald-300",
    text: "text-emerald-900/80 dark:text-emerald-100/80",
  },
  tight: {
    box: "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    big: "text-amber-700 dark:text-amber-300",
    text: "text-amber-900/80 dark:text-amber-100/80",
  },
  short: {
    box: "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10",
    icon: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    big: "text-red-700 dark:text-red-300",
    text: "text-red-900/80 dark:text-red-100/80",
  },
};

const Row = ({ label, value, minus, strong, hint }) => (
  <div className={`flex items-baseline justify-between gap-3 py-1.5 ${strong ? "border-t border-current/10 pt-2 font-semibold" : ""}`}>
    <span className="min-w-0">
      {label}
      {hint && <span className="block text-xs opacity-70">{hint}</span>}
    </span>
    <span className="shrink-0 tabular-nums">
      {minus ? "− " : ""}
      {value}
    </span>
  </div>
);

// "Safe to spend until payday", with the working shown underneath
const SafeToSpendCard = ({ compact = false }) => {
  const currency = useSelector((state) => state.auth.user?.currency) || "USD";
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await getSafeToSpend();
      setData(response.safeToSpend);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    // fetched in a callback, not in the effect body, so the first render isn't repeated
    const timer = setTimeout(load, 0);
    window.addEventListener(CASHFLOW_UPDATED_EVENT, load);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(CASHFLOW_UPDATED_EVENT, load);
    };
  }, [load]);

  if (failed) return null;

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
    );
  }

  const until = data.payday.source === "month_end" ? "the end of the month" : `payday (${shortDate(data.payday.date)})`;
  const modal = <PayPlanModal open={settingsOpen} onClose={() => setSettingsOpen(false)} currency={currency} />;

  // ---- not set up yet: ask for the balance ----
  if (data.level === "setup") {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-300 bg-white p-5 dark:border-emerald-500/40 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 dark:text-white">How much can you safely spend until {until}?</p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Add the money in your account and we&apos;ll take off your bills
              {data.billsTotal > 0 ? ` (${money(data.billsTotal, currency)} due before then)` : ""} and goal savings, then show
              what&apos;s left for each day.
            </p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
          >
            Add my balance
          </button>
        </div>
        {modal}
      </div>
    );
  }

  const tone = TONES[data.level] || TONES.ok;
  const balanceHint =
    data.balance.source === "bank"
      ? `From your connected bank${data.balance.asOf ? `, ${longDate(data.balance.asOf)}` : ""}`
      : `You entered ${money(data.balance.typed, currency)} on ${longDate(data.balance.asOf)}${
          data.balance.spentSince || data.balance.receivedSince
            ? `, then ${money(data.balance.spentSince, currency)} spent and ${money(data.balance.receivedSince, currency)} received`
            : ""
        }`;

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tone.box}`}>
      <div className="flex flex-wrap items-start gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
          {data.level === "short" ? <AlertOctagon className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          {data.level === "short" ? (
            <>
              <p className={`text-xl font-bold ${tone.big}`}>
                You may be {money(data.shortBy, currency)} short before {until}
              </p>
              <p className={`mt-1 text-sm ${tone.text}`}>
                Your bills and goal savings before then are more than the money you have
                {data.shortOn ? `, starting ${longDate(data.shortOn)}` : ""}. Hold off on spending that isn&apos;t essential, or move
                money in.
              </p>
            </>
          ) : (
            <>
              <p className={`text-sm font-medium ${tone.text}`}>Safe to spend until {until}</p>
              <p className={`text-3xl font-bold tabular-nums ${tone.big}`}>{money(data.safeToSpend, currency)}</p>
              <p className={`mt-0.5 text-sm ${tone.text}`}>
                About <span className="font-semibold">{money(data.perDay, currency)} a day</span> for the next {data.daysLeft} day
                {data.daysLeft === 1 ? "" : "s"}
                {data.level === "tight" && data.typicalDaily
                  ? `. That's less than half of your usual ${money(data.typicalDaily, currency)} a day, so go easy.`
                  : "."}
              </p>
            </>
          )}

          {data.payday.source === "month_end" && (
            <button
              onClick={() => setSettingsOpen(true)}
              className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline cursor-pointer ${tone.text}`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Tell us your payday for a more accurate number
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Pay and balance settings"
            title="Pay & balance"
            className={`rounded-lg p-2 hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer ${tone.text}`}
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`mt-3 flex items-center gap-1 text-xs font-semibold cursor-pointer ${tone.text}`}
      >
        How we worked this out
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`mt-2 rounded-xl bg-white/70 px-4 py-2 text-sm dark:bg-slate-900/40 ${tone.text}`}>
          <Row
            label={
              <span className="inline-flex items-center gap-1.5">
                {data.balance.source === "bank" && <Landmark className="h-3.5 w-3.5" />} Money you have now
              </span>
            }
            hint={balanceHint}
            value={money(data.balance.amount, currency)}
          />
          {data.bills.length > 0 ? (
            <>
              <Row label={`Bills & subscriptions due by ${shortDate(data.payday.date)}`} value={money(data.billsTotal, currency)} minus />
              <ul className="mb-1 ml-3 border-l border-current/15 pl-3 text-xs">
                {data.bills.slice(0, compact ? 4 : 8).map((bill, i) => (
                  <li key={`${bill.id}-${i}`} className="flex justify-between gap-3 py-0.5">
                    <span className="min-w-0 truncate">
                      {bill.name} · {bill.overdue ? <span className="font-semibold text-red-600">overdue</span> : whenLabel(bill.date).toLowerCase()}
                    </span>
                    <span className="tabular-nums">{money(bill.amount, currency)}</span>
                  </li>
                ))}
                {data.bills.length > (compact ? 4 : 8) && <li className="py-0.5 opacity-70">and {data.bills.length - (compact ? 4 : 8)} more</li>}
              </ul>
            </>
          ) : (
            <Row label="Bills & subscriptions due before then" hint="None added yet" value={money(0, currency)} minus />
          )}
          {data.goals.length > 0 && (
            <Row label="Set aside for your goals" hint={data.goals.map((g) => g.title).join(", ")} value={money(data.goalsTotal, currency)} minus />
          )}
          <Row label="Safe to spend" value={money(data.safeToSpend, currency)} strong />
        </div>
      )}

      {!compact && (
        <Link
          href="/dashboard/bills"
          className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline ${tone.text}`}
        >
          <CalendarDays className="h-3.5 w-3.5" /> Bills & calendar
        </Link>
      )}

      {modal}
    </div>
  );
};

export default SafeToSpendCard;
