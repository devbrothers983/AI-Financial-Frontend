"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Plus, Trash2 } from "lucide-react";

import Modal from "@/components/ui/Modal";
import { createBudget, updateBudget } from "@/services/budgetService";
import { getGoals } from "@/services/goalService";

const EXPENSE_CATEGORIES = ["food", "groceries", "entertainment", "transportation", "bills", "other"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const formatLabel = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const now = new Date();

const defaultFormState = {
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  totalBudget: "",
  categories: [],
  linkedGoal: "",
};

const inputClass = (hasError) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-500/20"
      : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-500/20"
  }`;

const BudgetFormModal = ({ open, onClose, onSaved, budget }) => {
  const isEdit = Boolean(budget);
  const [formData, setFormData] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    if (!open) return;

    setFormData(
      budget
        ? {
            month: budget.month,
            year: budget.year,
            totalBudget: budget.totalBudget,
            categories: budget.categories?.map((c) => ({ category: c.category, limit: c.limit })) || [],
            linkedGoal: budget.linkedGoal?._id || budget.linkedGoal || "",
          }
        : defaultFormState
    );
    setErrors({});

    getGoals({ status: "active" })
      .then((res) => setGoals(res.goals || []))
      .catch(() => setGoals([]));
  }, [open, budget]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCategoryChange = (index, field, value) => {
    setFormData((prev) => {
      const categories = [...prev.categories];
      categories[index] = { ...categories[index], [field]: value };
      return { ...prev, categories };
    });
  };

  const addCategoryRow = () => {
    setFormData((prev) => ({
      ...prev,
      categories: [...prev.categories, { category: EXPENSE_CATEGORIES[0], limit: "" }],
    }));
  };

  const removeCategoryRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.totalBudget || Number(formData.totalBudget) <= 0) {
      errs.totalBudget = "Enter an amount greater than 0";
    }
    formData.categories.forEach((c, i) => {
      if (!c.limit || Number(c.limit) <= 0) {
        errs[`category-${i}`] = "Enter a limit greater than 0";
      }
    });
    return errs;
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
      month: Number(formData.month),
      year: Number(formData.year),
      totalBudget: Number(formData.totalBudget),
      categories: formData.categories.map((c) => ({ category: c.category, limit: Number(c.limit) })),
      linkedGoal: formData.linkedGoal || null,
    };

    try {
      setSaving(true);
      if (isEdit) {
        await updateBudget(budget._id, payload);
        toast.success("Budget updated");
      } else {
        await createBudget(payload);
        toast.success("Budget created");
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

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit budget" : "New budget"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Month</label>
            <select
              name="month"
              value={formData.month}
              onChange={handleChange}
              disabled={isEdit}
              className={`cursor-pointer ${inputClass(false)} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              disabled={isEdit}
              className={`${inputClass(false)} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Total monthly budget</label>
          <input
            type="number"
            name="totalBudget"
            step="0.01"
            min="1"
            value={formData.totalBudget}
            onChange={handleChange}
            placeholder="0.00"
            className={inputClass(errors.totalBudget)}
          />
          {errors.totalBudget && <p className="text-xs font-medium text-red-500">{errors.totalBudget}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Auto-save leftover to goal (optional)
          </label>
          <select
            name="linkedGoal"
            value={formData.linkedGoal}
            onChange={handleChange}
            className={`cursor-pointer ${inputClass(false)}`}
          >
            <option value="">Don&apos;t auto-save</option>
            {goals.map((g) => (
              <option key={g._id} value={g._id}>
                {g.title}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Whatever&apos;s left of this budget when the month ends will be added to this goal&apos;s saved amount.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Category limits (optional)
            </label>
            <button
              type="button"
              onClick={addCategoryRow}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add category
            </button>
          </div>

          {formData.categories.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              No category limits set — just tracking the overall total.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {formData.categories.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={c.category}
                    onChange={(e) => handleCategoryChange(i, "category", e.target.value)}
                    className={`cursor-pointer ${inputClass(false)}`}
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {formatLabel(cat)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={c.limit}
                    onChange={(e) => handleCategoryChange(i, "limit", e.target.value)}
                    placeholder="Limit"
                    className={`w-32 ${inputClass(errors[`category-${i}`])}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeCategoryRow(i)}
                    className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 cursor-pointer"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create budget"}
        </button>
      </form>
    </Modal>
  );
};

export default BudgetFormModal;
