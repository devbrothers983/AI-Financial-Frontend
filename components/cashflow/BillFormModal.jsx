"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

import Modal from "@/components/ui/Modal";
import { createBill, updateBill, announceCashflowChange } from "@/services/cashflowService";
import { useCategories, formatCategory } from "@/lib/useCategories";
import { toDateInput, BILL_FREQUENCY_LABEL } from "./format";

const POPULAR = ["Rent", "Electricity", "Phone", "Internet", "Car insurance", "Car payment", "Loan payment", "Credit card"];

const REMINDERS = [
  { value: 0, label: "No reminder" },
  { value: 1, label: "1 day before" },
  { value: 3, label: "3 days before" },
  { value: 7, label: "1 week before" },
];

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-500/20";
const labelClass = "text-xs font-medium text-slate-500 dark:text-slate-400";

const blankForm = () => ({ name: "", amount: "", frequency: "monthly", nextDueDate: "", category: "bills", remindDaysBefore: 3 });

const formFrom = (bill) => ({
  ...blankForm(),
  ...(bill && {
    name: bill.name || "",
    amount: bill.amount ?? "",
    frequency: bill.frequency || "monthly",
    nextDueDate: toDateInput(bill.nextDueDate),
    category: bill.category || "bills",
    remindDaysBefore: bill.remindDaysBefore ?? 3,
  }),
});

// `bill` with an _id edits it; without one, it's a new bill. The form is
// created fresh each time the window opens, so it always starts from the bill.
const BillFormModal = ({ open, onClose, onSaved, bill }) => (
  <Modal open={open} onClose={onClose} title={bill?._id ? `Edit ${bill.name}` : "Add a bill"}>
    {open && <BillForm key={bill?._id || "new"} bill={bill} onClose={onClose} onSaved={onSaved} />}
  </Modal>
);

const BillForm = ({ onClose, onSaved, bill }) => {
  const [form, setForm] = useState(() => formFrom(bill));
  const [saving, setSaving] = useState(false);
  const { expense: expenseCategories } = useCategories();
  const isEditing = Boolean(bill?._id);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form, remindDaysBefore: Number(form.remindDaysBefore) };
      const response = isEditing ? await updateBill(bill._id, payload) : await createBill(payload);
      toast.success(response.message);
      announceCashflowChange();
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save this bill");
    } finally {
      setSaving(false);
    }
  };

  return (
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
          <input value={form.name} onChange={setField("name")} maxLength={100} required placeholder="e.g. Rent" className={fieldClass} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Amount
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={form.amount}
              onChange={setField("amount")}
              required
              placeholder="1200.00"
              className={fieldClass}
            />
          </label>
          <label className={labelClass}>
            How often
            <select value={form.frequency} onChange={setField("frequency")} className={`${fieldClass} cursor-pointer`}>
              {Object.entries(BILL_FREQUENCY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {form.frequency === "once" ? "Due date" : "Next due date"}
            <input type="date" value={form.nextDueDate} onChange={setField("nextDueDate")} required className={fieldClass} />
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

        <label className={labelClass}>
          Category (used when you mark it paid)
          <select value={form.category} onChange={setField("category")} className={`${fieldClass} cursor-pointer`}>
            {[...new Set([...expenseCategories, form.category])].map((name) => (
              <option key={name} value={name}>
                {formatCategory(name)}
              </option>
            ))}
          </select>
        </label>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Netflix, Spotify and other subscriptions go on the Subscriptions page. They&apos;re counted here automatically.
        </p>

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
            {saving ? "Saving..." : isEditing ? "Save changes" : "Add bill"}
          </button>
        </div>
      </form>
  );
};

export default BillFormModal;
