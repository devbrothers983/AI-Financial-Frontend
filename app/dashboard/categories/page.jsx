"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { Tags, Plus, Pencil, Trash2, Check, X, ArrowRight, Wand2 } from "lucide-react";

import { useCategories, formatCategory } from "@/lib/useCategories";
import {
  createCategory,
  renameCategory,
  deleteCategory,
  saveCategoryRule,
  deleteCategoryRule,
} from "@/services/categoryService";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/Skeleton";

const KIND_LABEL = { expense: "Expense", income: "Income", both: "Expense and income" };

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-500/20";

const primaryButton =
  "flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer";

const iconButton =
  "rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer";

const CategoriesPage = () => {
  const { expense, income, builtIn, custom, rules, loading, reload } = useCategories();

  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState("expense");
  const [ruleText, setRuleText] = useState("");
  const [ruleCategory, setRuleCategory] = useState("transportation");
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const run = async (action) => {
    try {
      setBusy(true);
      const response = await action();
      toast.success(response.message);
      await reload();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (await run(() => createCategory({ name: newName, kind: newKind }))) setNewName("");
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (await run(() => saveCategoryRule({ matchText: ruleText, category: ruleCategory, applyToExisting: true }))) setRuleText("");
  };

  const handleRename = async (id) => {
    if (await run(() => renameCategory(id, editingName))) setEditingId(null);
  };

  const handleDeleteConfirm = async () => {
    if (await run(() => deleteCategory(deleteTarget._id))) setDeleteTarget(null);
  };

  const ruleOptions = [...new Set([...expense, ...income])];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 text-white">
          <Tags className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categories</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Make your own categories, and sort transactions automatically.</p>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <Wand2 className="h-4 w-4 text-emerald-500" /> Automatic rules
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choose a category for any transaction containing a word. Rules apply to bank and CSV imports, and to matching
              transactions you already have.
            </p>

            <form onSubmit={handleAddRule} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="min-w-0 flex-1 basis-40 text-xs font-medium text-slate-500 dark:text-slate-400">
                If it contains
                <input
                  id="rule-text"
                  value={ruleText}
                  onChange={(e) => setRuleText(e.target.value)}
                  maxLength={60}
                  required
                  placeholder="e.g. Uber"
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="min-w-0 flex-1 basis-40 text-xs font-medium text-slate-500 dark:text-slate-400">
                Put it under
                <select
                  id="rule-category"
                  value={ruleCategory}
                  onChange={(e) => setRuleCategory(e.target.value)}
                  className={`${fieldClass} mt-1 cursor-pointer`}
                >
                  {ruleOptions.map((name) => (
                    <option key={name} value={name}>
                      {formatCategory(name)}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={busy} className={primaryButton}>
                <Plus className="h-4 w-4" /> Add rule
              </button>
            </form>

            {rules.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                {rules.map((rule) => (
                  <li key={rule._id} className="flex items-center gap-2 py-2.5 text-sm">
                    <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-200">{formatCategory(rule.matchText)}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">{formatCategory(rule.category)}</span>
                    <button
                      onClick={() => run(() => deleteCategoryRule(rule._id))}
                      disabled={busy}
                      aria-label={`Remove the rule for ${rule.matchText}`}
                      className={iconButton}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                No rules yet. When you change a transaction&apos;s category, we&apos;ll also offer to remember it.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Your categories</h2>

            <form onSubmit={handleAddCategory} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="min-w-0 flex-1 basis-40 text-xs font-medium text-slate-500 dark:text-slate-400">
                New category
                <input
                  id="category-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={30}
                  required
                  placeholder="e.g. Pet care"
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="min-w-0 flex-1 basis-40 text-xs font-medium text-slate-500 dark:text-slate-400">
                Used for
                <select
                  id="category-kind"
                  value={newKind}
                  onChange={(e) => setNewKind(e.target.value)}
                  className={`${fieldClass} mt-1 cursor-pointer`}
                >
                  {Object.entries(KIND_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={busy} className={primaryButton}>
                <Plus className="h-4 w-4" /> Add category
              </button>
            </form>

            {custom.length > 0 && (
              <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                {custom.map((category) => (
                  <li key={category._id} className="flex items-center gap-2 py-2.5 text-sm">
                    {editingId === category._id ? (
                      <>
                        <input
                          id={`rename-${category._id}`}
                          aria-label={`New name for ${category.name}`}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          maxLength={30}
                          className={`${fieldClass} min-w-0 flex-1`}
                        />
                        <button onClick={() => handleRename(category._id)} disabled={busy} aria-label="Save name" className={iconButton}>
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} aria-label="Cancel renaming" className={iconButton}>
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-200">{formatCategory(category.name)}</span>
                        <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{KIND_LABEL[category.kind]}</span>
                        <button
                          onClick={() => {
                            setEditingId(category._id);
                            setEditingName(formatCategory(category.name));
                          }}
                          aria-label={`Rename ${category.name}`}
                          className={iconButton}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(category)} aria-label={`Delete ${category.name}`} className={iconButton}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Built in, always available</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...new Set([...builtIn.expense, ...builtIn.income])].map((name) => (
                  <span key={name} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {formatCategory(name)}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={busy}
        title={`Delete ${formatCategory(deleteTarget?.name)}?`}
        description="Its transactions move to Other, nothing is lost. Any rules and budget limits for this category are removed."
      />
    </div>
  );
};

export default CategoriesPage;
