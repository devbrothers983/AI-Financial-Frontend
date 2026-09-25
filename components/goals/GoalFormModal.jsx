"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

import Modal from "@/components/ui/Modal";
import { createGoal, updateGoal } from "@/services/goalService";

const PRIORITIES = ["low", "medium", "high"];

const formatLabel = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const toDateInputValue = (date) => new Date(date).toISOString().slice(0, 10);

const defaultFormState = {
  title: "",
  description: "",
  targetAmount: "",
  currentAmount: "",
  targetDate: "",
  priority: "medium",
};

const inputClass = (hasError) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-500/20"
      : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-500/20"
  }`;

const GoalFormModal = ({ open, onClose, onSaved, goal }) => {
  const isEdit = Boolean(goal);
  const [formData, setFormData] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setFormData(
      goal
        ? {
            title: goal.title,
            description: goal.description || "",
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount || "",
            targetDate: toDateInputValue(goal.targetDate),
            priority: goal.priority,
          }
        : defaultFormState
    );
    setErrors({});
  }, [open, goal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = "Give your goal a name";
    if (!formData.targetAmount || Number(formData.targetAmount) <= 0) {
      errs.targetAmount = "Enter an amount greater than 0";
    }
    if (!formData.targetDate) errs.targetDate = "Target date is required";
    else if (new Date(formData.targetDate) <= new Date()) {
      errs.targetDate = "Target date must be in the future";
    }
    if (
      formData.currentAmount !== "" &&
      Number(formData.currentAmount) > Number(formData.targetAmount)
    ) {
      errs.currentAmount = "Can't exceed the target amount";
    }
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
      title: formData.title,
      description: formData.description,
      targetAmount: Number(formData.targetAmount),
      currentAmount: formData.currentAmount === "" ? 0 : Number(formData.currentAmount),
      targetDate: formData.targetDate,
      priority: formData.priority,
    };

    try {
      setSaving(true);
      if (isEdit) {
        await updateGoal(goal._id, payload);
        toast.success("Goal updated");
      } else {
        await createGoal(payload);
        toast.success("Goal created");
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit goal" : "New goal"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Goal name</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Emergency fund"
            maxLength={100}
            className={inputClass(errors.title)}
          />
          {errors.title && <p className="text-xs font-medium text-red-500">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target amount</label>
            <input
              type="number"
              name="targetAmount"
              step="0.01"
              min="1"
              value={formData.targetAmount}
              onChange={handleChange}
              placeholder="0.00"
              className={inputClass(errors.targetAmount)}
            />
            {errors.targetAmount && (
              <p className="text-xs font-medium text-red-500">{errors.targetAmount}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Already saved</label>
            <input
              type="number"
              name="currentAmount"
              step="0.01"
              min="0"
              value={formData.currentAmount}
              onChange={handleChange}
              placeholder="0.00"
              className={inputClass(errors.currentAmount)}
            />
            {errors.currentAmount && (
              <p className="text-xs font-medium text-red-500">{errors.currentAmount}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target date</label>
            <input
              type="date"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              className={inputClass(errors.targetDate)}
            />
            {errors.targetDate && (
              <p className="text-xs font-medium text-red-500">{errors.targetDate}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
            <select name="priority" value={formData.priority} onChange={handleChange} className={`cursor-pointer ${inputClass(false)}`}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {formatLabel(p)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes (optional)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            maxLength={500}
            className={`resize-none ${inputClass(false)}`}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create goal"}
        </button>
      </form>
    </Modal>
  );
};

export default GoalFormModal;
