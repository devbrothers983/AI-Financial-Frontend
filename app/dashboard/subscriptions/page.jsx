"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Repeat,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Ban,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Bell,
  BellOff,
  TrendingUp,
  CalendarClock,
} from "lucide-react";

import {
  getSubscriptions,
  createSubscription,
  checkSubscriptionLink,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  deleteSubscription,
  dismissSubscription,
  restoreSubscription,
} from "@/services/subscriptionService";
import SubscriptionFormModal from "@/components/subscriptions/SubscriptionFormModal";
import CancelSubscriptionModal from "@/components/subscriptions/CancelSubscriptionModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/Skeleton";

const FREQUENCY_LABEL = { weekly: "Weekly", monthly: "Monthly", quarterly: "Every 3 months", yearly: "Yearly" };
const PER_LABEL = { weekly: "a week", monthly: "a month", quarterly: "every 3 months", yearly: "a year" };

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const daysFromToday = (value) => {
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const date = new Date(value);
  return Math.round((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - today) / 86400000);
};

const whenLabel = (days) => (days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`);

const actionClass =
  "flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer";

const SummaryTile = ({ label, value, hint }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-1 truncate text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
  </div>
);

const Section = ({ title, hint, children }) => (
  <section>
    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
    {hint && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
    <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {children}
    </ul>
  </section>
);

const Notice = ({ icon: Icon, tone, children }) => (
  <p className={`mt-2 flex flex-wrap items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${tone}`}>
    <Icon className="h-3.5 w-3.5 shrink-0" />
    {children}
  </p>
);

const WARNING_TONE = "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300";
const DANGER_TONE = "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300";

const SubscriptionsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formSubscription, setFormSubscription] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await getSubscriptions();
      setData(response);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const money = (value) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: data?.currency || "USD" }).format(value || 0);

  const run = async (action) => {
    try {
      setBusy(true);
      const response = await action();
      toast.success(response.message);
      await fetchSubscriptions();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update this subscription");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openForm = (subscription = null) => {
    setFormSubscription(subscription);
    setFormOpen(true);
  };

  // A detected subscription isn't saved yet, so save it first. That also lets
  // the page warn the user if the company charges them again.
  const handleCancelConfirm = async () => {
    const done = await run(async () => {
      let id = cancelTarget._id;
      if (!id) {
        const created = await createSubscription({
          name: cancelTarget.name,
          amount: cancelTarget.amount,
          frequency: cancelTarget.frequency,
          nextChargeDate: new Date(cancelTarget.nextChargeDate).toISOString().slice(0, 10),
          category: cancelTarget.category,
          remindDaysBefore: 0,
          manageUrl: cancelTarget.manageUrl || "",
        });
        id = created.subscription._id;
      }
      return cancelSubscription(id);
    });
    if (done) setCancelTarget(null);
  };

  // Saved right away for a tracked subscription. A detected one isn't stored
  // yet, so the server checks the link and it's kept until the user confirms.
  const handleSaveCancelLink = async (manageUrl) => {
    const save = cancelTarget._id ? () => updateSubscription(cancelTarget._id, { manageUrl }) : () => checkSubscriptionLink(manageUrl);
    if (!(await run(save))) return false;
    setCancelTarget((prev) => ({ ...prev, manageUrl }));
    return true;
  };

  const handleDeleteConfirm = async () => {
    if (await run(() => deleteSubscription(deleteTarget._id))) setDeleteTarget(null);
  };

  const isEmpty =
    data && !data.tracked.length && !data.cancelled.length && !data.suggestions.length && !data.possiblyCancelled.length && !data.hidden.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 text-white">
            <Repeat className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subscriptions</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">See what you pay for and what renews next.</p>
          </div>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add subscription
        </button>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : !data ? null : isEmpty ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <Repeat className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 font-medium text-slate-800 dark:text-slate-200">No subscriptions yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Add one to get a reminder before it renews. We&apos;ll also suggest any regular charges we find in your transactions.
          </p>
          <button
            onClick={() => openForm()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add your first subscription
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryTile label="Per month" value={money(data.summary.monthlyTotal)} hint={`${data.summary.activeCount} active`} />
            <SummaryTile label="Per year" value={money(data.summary.yearlyTotal)} />
            <SummaryTile label="Due in the next 30 days" value={money(data.summary.dueIn30Days)} />
            <SummaryTile label="Saved by cancelling" value={money(data.summary.savedSoFar)} hint="Estimated so far" />
          </div>

          {data.tracked.length > 0 && (
            <Section title="Coming up" hint="Your subscriptions, soonest first.">
              {data.tracked.map((s) => {
                const days = daysFromToday(s.nextChargeDate);
                return (
                  <li key={s._id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                      <div className="min-w-0 flex-1 basis-48">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                          {s.name}
                          {s.isTrial && (
                            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                              Free trial
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className={days <= 3 ? "font-semibold text-amber-700 dark:text-amber-300" : ""}>{whenLabel(days)}</span>
                          <span>· {formatDate(s.nextChargeDate)}</span>
                          <span className="inline-flex items-center gap-1">
                            · {s.remindDaysBefore > 0 ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                            {s.remindDaysBefore > 0 ? `Reminder ${s.remindDaysBefore} ${s.remindDaysBefore === 1 ? "day" : "days"} before` : "No reminder"}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {money(s.amount)} <span className="font-normal text-slate-500 dark:text-slate-400">{PER_LABEL[s.frequency]}</span>
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{money(s.yearlyCost)} a year</p>
                      </div>
                    </div>

                    {s.latestChargedAmount !== null && (
                      <Notice icon={TrendingUp} tone={WARNING_TONE}>
                        Your latest charge was {money(s.latestChargedAmount)}, not {money(s.amount)}.
                        <button
                          onClick={() => run(() => updateSubscription(s._id, { amount: s.latestChargedAmount }))}
                          disabled={busy}
                          className="font-semibold underline underline-offset-2 cursor-pointer"
                        >
                          Update the price
                        </button>
                      </Notice>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.manageUrl && (
                        <a href={s.manageUrl} target="_blank" rel="noopener noreferrer" className={actionClass}>
                          <ExternalLink className="h-3.5 w-3.5" /> Open website
                        </a>
                      )}
                      <button onClick={() => openForm(s)} className={actionClass}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => setCancelTarget(s)} className={actionClass}>
                        <Ban className="h-3.5 w-3.5" /> Cancel subscription
                      </button>
                    </div>
                  </li>
                );
              })}
            </Section>
          )}

          {data.suggestions.length > 0 && (
            <Section title="Found in your transactions" hint="Regular charges we noticed. Track them to get reminders.">
              {data.suggestions.map((s) => (
                <li key={s.merchantKey} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {FREQUENCY_LABEL[s.frequency]} · next around {formatDate(s.nextChargeDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{money(s.amount)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{money(s.yearlyCost)} a year</p>
                    </div>
                  </div>
                  {s.previousAmount !== null && s.amount > s.previousAmount && (
                    <Notice icon={TrendingUp} tone={WARNING_TONE}>
                      Price went up from {money(s.previousAmount)} to {money(s.amount)}.
                    </Notice>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => openForm({ ...s, _id: undefined, remindDaysBefore: 3 })}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      <Bell className="h-3.5 w-3.5" /> Track this
                    </button>
                    <button onClick={() => setCancelTarget(s)} className={actionClass}>
                      <Ban className="h-3.5 w-3.5" /> Cancel subscription
                    </button>
                    <button onClick={() => run(() => dismissSubscription(s.merchantKey))} disabled={busy} className={actionClass}>
                      <EyeOff className="h-3.5 w-3.5" /> Not a subscription
                    </button>
                  </div>
                </li>
              ))}
            </Section>
          )}

          {data.possiblyCancelled.length > 0 && (
            <Section title="Possibly cancelled" hint="These stopped charging, so they aren't in your totals.">
              {data.possiblyCancelled.map((s) => (
                <li key={s.merchantKey} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Last charged {formatDate(s.lastChargeDate)}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{money(s.amount)}</p>
                  <button onClick={() => run(() => dismissSubscription(s.merchantKey))} disabled={busy} className={actionClass}>
                    <EyeOff className="h-3.5 w-3.5" /> Hide
                  </button>
                </li>
              ))}
            </Section>
          )}

          {data.cancelled.length > 0 && (
            <Section title="Cancelled" hint="We'll warn you here if one of these charges you again.">
              {data.cancelled.map((s) => (
                <li key={s._id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {s.cancelledAt && `Cancelled ${formatDate(s.cancelledAt)} · `}saves {money(s.yearlyCost)} a year
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => run(() => reactivateSubscription(s._id))} disabled={busy} className={actionClass}>
                        <RotateCcw className="h-3.5 w-3.5" /> Reactivate
                      </button>
                      <button onClick={() => setDeleteTarget(s)} className={actionClass}>
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                  {s.chargedAfterCancelDate && (
                    <Notice icon={AlertTriangle} tone={DANGER_TONE}>
                      You were charged on {formatDate(s.chargedAfterCancelDate)}, after cancelling. Check with {s.name}.
                      {s.manageUrl && (
                        <a href={s.manageUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
                          Manage
                        </a>
                      )}
                    </Notice>
                  )}
                </li>
              ))}
            </Section>
          )}

          {data.hidden.length > 0 && (
            <Section title="Hidden" hint="You marked these as not being subscriptions.">
              {data.hidden.map((s) => (
                <li key={s.merchantKey} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                  <p className="min-w-0 flex-1 basis-48 truncate text-sm text-slate-700 dark:text-slate-300">{s.name}</p>
                  <button onClick={() => run(() => restoreSubscription(s.merchantKey))} disabled={busy} className={actionClass}>
                    <Eye className="h-3.5 w-3.5" /> Show again
                  </button>
                </li>
              ))}
            </Section>
          )}

          <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Dates and costs for subscriptions we found are estimates from your past charges. Only the company can stop a
            subscription, so confirming here doesn&apos;t cancel it with them.
          </p>
        </div>
      )}

      <SubscriptionFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={fetchSubscriptions} subscription={formSubscription} />

      <CancelSubscriptionModal
        key={cancelTarget?._id || cancelTarget?.merchantKey || "closed"}
        subscription={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        onSaveLink={handleSaveCancelLink}
        busy={busy}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={busy}
        loadingLabel="Removing..."
        confirmLabel="Remove"
        title={`Remove ${deleteTarget?.name}?`}
        description="We'll stop tracking it. Past expenses stay in your Transactions."
      />
    </div>
  );
};

export default SubscriptionsPage;
