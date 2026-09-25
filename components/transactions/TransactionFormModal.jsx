"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";

import Modal from "@/components/ui/Modal";
import { createTransaction, updateTransaction } from "@/services/transactionService";
import { checkExpenseImpact } from "@/services/budgetService";

const EXPENSE_CATEGORIES = ["food", "groceries", "entertainment", "transportation", "bills", "other"];
const INCOME_CATEGORIES = ["salary", "freelance", "investment", "gift", "other"];
const PAYMENT_METHODS = ["cash", "credit_card", "debit_card", "bank_transfer", "other"];
const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"];

const formatLabel = (value) => value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const toDateInputValue = (date) => new Date(date).toISOString().slice(0, 10);

const defaultFormState = {
  transactionType: "expense",
  transactionAmount: "",
  transactionCategory: "food",
  description: "",
  transactionDate: toDateInputValue(new Date()),
  paymentMethod: "cash",
  isRecurring: false,
  recurringFrequency: "monthly",
  transactionNotes: "",
};

const TransactionFormModal = ({ open, onClose, onSaved, transaction }) => {
  const isEdit = Boolean(transaction);
  const [formData, setFormData] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [checkingImpact, setCheckingImpact] = useState(false);
  const [impact, setImpact] = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);

  const categories = formData.transactionType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (type) => {
    const nextCategories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setFormData((prev) => ({
      ...prev,
      transactionType: type,
      transactionCategory: nextCategories.includes(prev.transactionCategory)
        ? prev.transactionCategory
        : nextCategories[0],
    }));
  };

  useEffect(() => {
    if (!open) return;

    setFormData(
      transaction
        ? {
            transactionType: transaction.transactionType,
            transactionAmount: transaction.transactionAmount,
            transactionCategory: transaction.transactionCategory,
            description: transaction.description || "",
            transactionDate: toDateInputValue(transaction.transactionDate),
            paymentMethod: transaction.paymentMethod,
            isRecurring: transaction.isRecurring,
            recurringFrequency: transaction.recurringFrequency || "monthly",
            transactionNotes: transaction.transactionNotes || "",
          }
        : defaultFormState
    );
    setErrors({});
    setImpact(null);
    setPendingPayload(null);
  }, [open, transaction]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.transactionAmount || Number(formData.transactionAmount) <= 0) {
      errs.transactionAmount = "Enter an amount greater than 0";
    }
    if (!formData.transactionDate) errs.transactionDate = "Date is required";
    return errs;
  };

  const submitTransaction = async (payload) => {
    try {
      setSaving(true);
      if (isEdit) {
        await updateTransaction(transaction._id, payload);
        toast.success("Transaction updated");
      } else {
        await createTransaction(payload);
        toast.success("Transaction added");
      }
      onSaved();
      onClose();
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning("Please fix the errors below");
      return;
    }

    const payload = {
      ...formData,
      transactionAmount: Number(formData.transactionAmount),
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
    };

    if (formData.transactionType === "expense") {
      try {
        setCheckingImpact(true);
        const response = await checkExpenseImpact({
          transactionAmount: payload.transactionAmount,
          transactionCategory: payload.transactionCategory,
          transactionDate: payload.transactionDate,
          excludeTransactionId: transaction?._id,
        });

        if (response.impact.severity !== "none") {
          setImpact(response.impact);
          setPendingPayload(payload);
          return;
        }
      } catch {
        // If the impact check fails, don't block the user from adding the transaction.
      } finally {
        setCheckingImpact(false);
      }
    }

    await submitTransaction(payload);
  };

  const handleConfirmAnyway = async () => {
    const payload = pendingPayload;
    setImpact(null);
    setPendingPayload(null);
    await submitTransaction(payload);
  };

  const handleGoBack = () => {
    setImpact(null);
    setPendingPayload(null);
  };

  const inputClass = (hasError) =>
    `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 ${
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-500/20"
        : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-500/20"
    }`;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

  if (impact) {
    const isSevere = impact.severity === "over_budget" || impact.severity === "category_over";

    return (
      <Modal open={open} onClose={onClose} title="Heads up">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                isSevere
                  ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
                  : "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
              {impact.severity === "category_over" && (
                <p>
                  This will put you <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(impact.category.exceedByAmount)} over</span>{" "}
                  your <span className="capitalize">{impact.category.name}</span> budget of {formatCurrency(impact.category.limit)} — you&apos;ve already spent{" "}
                  {formatCurrency(impact.category.spentBefore)}.
                </p>
              )}

              {impact.severity === "over_budget" && (
                <p>
                  This will put you <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(impact.budgetExceedByAmount)} over</span>{" "}
                  your total monthly budget of {formatCurrency(impact.totalBudget)}.
                </p>
              )}

              {impact.severity === "warning" && (
                <p>
                  This will use{" "}
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {Math.round((impact.totalSpentAfter / impact.totalBudget) * 100)}%
                  </span>{" "}
                  of your monthly budget of {formatCurrency(impact.totalBudget)}, leaving only {formatCurrency(impact.remainingAfter)}.
                </p>
              )}

              {impact.linkedGoal && isSevere && (
                <p>
                  Your budget&apos;s leftover normally auto-saves toward{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">&ldquo;{impact.linkedGoal.title}&rdquo;</span> (needs about{" "}
                  {formatCurrency(impact.linkedGoal.requiredMonthlyPace)}/month to stay on schedule). Going over budget means there&apos;ll be less — or nothing — left to put toward it this month.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleGoBack}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Go back
            </button>
            <button
              type="button"
              onClick={handleConfirmAnyway}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Add anyway
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit transaction" : "Add transaction"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {["expense", "income"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`rounded-lg py-2 text-sm font-semibold capitalize transition-colors cursor-pointer ${
                formData.transactionType === type
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
            <input
              type="number"
              name="transactionAmount"
              step="0.01"
              min="0.01"
              value={formData.transactionAmount}
              onChange={handleChange}
              placeholder="0.00"
              className={inputClass(errors.transactionAmount)}
            />
            {errors.transactionAmount && (
              <p className="text-xs font-medium text-red-500">{errors.transactionAmount}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
            <input
              type="date"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleChange}
              className={inputClass(errors.transactionDate)}
            />
            {errors.transactionDate && (
              <p className="text-xs font-medium text-red-500">{errors.transactionDate}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
            <select
              name="transactionCategory"
              value={formData.transactionCategory}
              onChange={handleChange}
              className={`cursor-pointer ${inputClass(false)}`}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {formatLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment method</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className={`cursor-pointer ${inputClass(false)}`}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {formatLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g. Grocery run at Walmart"
            maxLength={200}
            className={inputClass(false)}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            name="isRecurring"
            checked={formData.isRecurring}
            onChange={handleChange}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800"
          />
          This is a recurring transaction
        </label>

        {formData.isRecurring && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Frequency</label>
            <select
              name="recurringFrequency"
              value={formData.recurringFrequency}
              onChange={handleChange}
              className={`cursor-pointer ${inputClass(false)}`}
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {formatLabel(f)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes (optional)</label>
          <textarea
            name="transactionNotes"
            value={formData.transactionNotes}
            onChange={handleChange}
            rows={2}
            maxLength={500}
            className={`resize-none ${inputClass(false)}`}
          />
        </div>

        <button
          type="submit"
          disabled={saving || checkingImpact}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
        >
          {(saving || checkingImpact) && <Loader2 className="h-4 w-4 animate-spin" />}
          {checkingImpact ? "Checking budget..." : saving ? "Saving..." : isEdit ? "Save changes" : "Add transaction"}
        </button>
      </form>
    </Modal>
  );
};

export default TransactionFormModal;
