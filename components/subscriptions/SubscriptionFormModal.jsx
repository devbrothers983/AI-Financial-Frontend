"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

import Modal from "@/components/ui/Modal";
import { createSubscription, updateSubscription } from "@/services/subscriptionService";
import { normalizeLink, siteName, linkMatchesName } from "@/lib/cancelLinks";
import { useCategories, formatCategory } from "@/lib/useCategories";

const POPULAR = ["Netflix", "Spotify", "YouTube Premium", "Udemy", "Amazon Prime", "iCloud", "ChatGPT", "Gym"];

const REMINDERS = [
  { value: 0, label: "No reminder" },
  { value: 1, label: "1 day before" },
  { value: 3, label: "3 days before" },
  { value: 7, label: "1 week before" },
];

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-500/20";

const labelClass = "text-xs font-medium text-slate-500 dark:text-slate-400";

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const blankForm = () => ({
  name: "",
  amount: "",
  frequency: "monthly",
  nextChargeDate: "",
  category: "subscriptions",
  remindDaysBefore: 3,
  isTrial: false,
  autoAddExpense: false,
  manageUrl: "",
});

// `subscription` with an _id edits it; without one, it prefills a new subscription
const SubscriptionFormModal = ({ open, onClose, onSaved, subscription }) => {
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const { expense: expenseCategories } = useCategories();

  const isEditing = Boolean(subscription?._id);
  const typedLink = normalizeLink(form.manageUrl);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...blankForm(),
      ...(subscription && {
        name: subscription.name || "",
        amount: subscription.amount ?? "",
        frequency: subscription.frequency || "monthly",
        nextChargeDate: toDateInput(subscription.nextChargeDate),
        // a charge we found often sits in "other", which isn't a useful place for it
        category: subscription.category && subscription.category !== "other" ? subscription.category : "subscriptions",
        remindDaysBefore: subscription.remindDaysBefore ?? 3,
        isTrial: Boolean(subscription.isTrial),
        autoAddExpense: Boolean(subscription.autoAddExpense),
        manageUrl: subscription.manageUrl || "",
      }),
    });
  }, [open, subscription]);

  const setField = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form, remindDaysBefore: Number(form.remindDaysBefore) };
      const response = isEditing ? await updateSubscription(subscription._id, payload) : await createSubscription(payload);
      toast.success(response.message);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save this subscription");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? `Edit ${subscription.name}` : "Add a subscription"}>
      <form onSubmit={handleSubmit} className="flex max-h-[75vh] flex-col gap-3 overflow-y-auto pr-1">
        {!isEditing && !form.name && (
          <div className="flex flex-wrap gap-1.5">
            {POPULAR.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, name }))}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <label className={labelClass}>
          Name
          <input value={form.name} onChange={setField("name")} maxLength={100} required placeholder="e.g. Udemy" className={fieldClass} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Price
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={form.amount}
              onChange={setField("amount")}
              required
              placeholder="10.00"
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            Charged
            <select value={form.frequency} onChange={setField("frequency")} className={`${fieldClass} cursor-pointer`}>
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
              <option value="quarterly">Every 3 months</option>
              <option value="yearly">Every year</option>
            </select>
          </label>
          <label className={labelClass}>
            {form.isTrial ? "Free trial ends on" : "Next charge date"}
            <input type="date" value={form.nextChargeDate} onChange={setField("nextChargeDate")} required className={fieldClass} />
          </label>
          <label className={labelClass}>
            Remind me
            <select value={form.remindDaysBefore} onChange={setField("remindDaysBefore")} className={`${fieldClass} cursor-pointer`}>
              {REMINDERS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={form.isTrial} onChange={setField("isTrial")} className="mt-0.5 h-4 w-4 cursor-pointer accent-emerald-600" />
          <span>
            This is a free trial
            <span className="block text-xs text-slate-500 dark:text-slate-400">We&apos;ll warn you before the first charge, by email too.</span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={form.autoAddExpense} onChange={setField("autoAddExpense")} className="mt-0.5 h-4 w-4 cursor-pointer accent-emerald-600" />
          <span>
            Add this expense to Transactions automatically
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Leave this off if your bank is connected, because the charge will already be imported.
            </span>
          </span>
        </label>

        {form.autoAddExpense && (
          <label className={labelClass}>
            Category for the expense
            <select value={form.category} onChange={setField("category")} className={`${fieldClass} cursor-pointer`}>
              {[...new Set([...expenseCategories, form.category])].map((name) => (
                <option key={name} value={name}>
                  {formatCategory(name)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className={labelClass}>
          Company website or cancel page (optional)
          <input
            value={form.manageUrl}
            onChange={setField("manageUrl")}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            maxLength={500}
            placeholder="e.g. udemy.com/settings"
            className={fieldClass}
          />
          <span className="mt-1 block font-normal">Add it now to reach it in one tap when you want to cancel.</span>
          {typedLink && !linkMatchesName(typedLink, form.name) && (
            <span className="mt-1 block font-medium text-amber-700 dark:text-amber-300">
              {siteName(typedLink)} doesn&apos;t mention {form.name || "this subscription"}. Check it&apos;s the right website.
            </span>
          )}
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : isEditing ? "Save changes" : "Add subscription"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SubscriptionFormModal;
