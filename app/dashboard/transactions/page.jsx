"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Utensils,
  ShoppingCart,
  Film,
  Car,
  Receipt,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  MoreHorizontal,
  Upload,
  Download,
  Loader2,
  Landmark,
  AlertTriangle,
  Repeat,
} from "lucide-react";

import { getTransactions, deleteTransaction } from "@/services/transactionService";
import { downloadFromApi } from "@/lib/download";
import TransactionFormModal from "@/components/transactions/TransactionFormModal";
import ImportTransactionsModal from "@/components/transactions/ImportTransactionsModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { useCategories, formatCategory } from "@/lib/useCategories";
import { saveCategoryRule } from "@/services/categoryService";
import Skeleton from "@/components/Skeleton";

const CATEGORY_ICONS = {
  food: Utensils,
  groceries: ShoppingCart,
  entertainment: Film,
  transportation: Car,
  bills: Receipt,
  salary: Briefcase,
  freelance: Laptop,
  investment: TrendingUp,
  gift: Gift,
  subscriptions: Repeat,
  other: MoreHorizontal,
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const rowVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const selectClass =
  "cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:ring-emerald-500/20";

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ transactionType: "", transactionCategory: "", sort: "newest" });
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { all: allCategories } = useCategories();
  const [ruleSuggestion, setRuleSuggestion] = useState(null);
  const [savingRule, setSavingRule] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10, sort: filters.sort };
      if (filters.transactionType) params.transactionType = filters.transactionType;
      if (filters.transactionCategory) params.transactionCategory = filters.transactionCategory;

      const response = await getTransactions(params);
      setTransactions(response.transactions);
      setPagination(response.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  // Changing a category by hand can offer to remember it for that merchant
  const handleSaved = (response) => {
    fetchTransactions();
    if (response?.ruleSuggestion) setRuleSuggestion(response.ruleSuggestion);
  };

  const handleSaveRule = async () => {
    try {
      setSavingRule(true);
      const response = await saveCategoryRule({ ...ruleSuggestion, applyToExisting: true });
      toast.success(response.message);
      setRuleSuggestion(null);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save this rule");
    } finally {
      setSavingRule(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      // exports everything matching the current type filter, not just this page
      const params = filters.transactionType ? { transactionType: filters.transactionType } : undefined;
      await downloadFromApi("/transactions/export", params, "transactions.csv");
    } catch {
      toast.error("Failed to export transactions");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteTransaction(deleteTarget._id);
      toast.success("Transaction deleted");
      setDeleteTarget(null);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete transaction");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track every dollar coming in and going out.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-105 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add transaction
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select name="transactionType" value={filters.transactionType} onChange={handleFilterChange} className={selectClass}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select
          name="transactionCategory"
          value={filters.transactionCategory}
          onChange={handleFilterChange}
          className={selectClass}
        >
          <option value="">All categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {formatCategory(c)}
            </option>
          ))}
        </select>

        <select name="sort" value={filters.sort} onChange={handleFilterChange} className={selectClass}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
            No transactions match these filters yet.
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={listVariants}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((transaction) => {
                const Icon = CATEGORY_ICONS[transaction.transactionCategory] || MoreHorizontal;
                const isIncome = transaction.transactionType === "income";

                return (
                  <motion.li
                    key={transaction._id}
                    variants={rowVariants}
                    className="group flex items-center gap-3 px-5 py-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <Icon className="h-4 w-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {transaction.description || transaction.transactionCategory}
                      </p>
                      <p className="text-xs capitalize text-slate-400 dark:text-slate-500">
                        {transaction.transactionCategory} · {formatDate(transaction.transactionDate)}
                      </p>
                      {transaction.source === "bank" && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            title={transaction.bankAccountName || "Imported from your bank"}
                            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                          >
                            <Landmark className="h-3 w-3" /> {transaction.bankAccountName || "Bank"}
                          </span>
                          {transaction.isPending && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              Pending
                            </span>
                          )}
                          {transaction.possibleDuplicateOf && (
                            <span
                              title="A transaction you entered yourself has the same amount within 2 days. If it's the same purchase, delete one of them."
                              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                            >
                              <AlertTriangle className="h-3 w-3" /> Possible duplicate
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={`shrink-0 text-sm font-semibold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                      {isIncome ? "+" : "-"}
                      {formatCurrency(transaction.transactionAmount)}
                    </div>

                    {/* always visible on touch screens, where there's no hover */}
                    <div className="flex shrink-0 items-center gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                      <button
                        onClick={() => openEditModal(transaction)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(transaction)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 cursor-pointer"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={pagination.currentPage <= 1}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <TransactionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        transaction={editingTransaction}
      />

      <ImportTransactionsModal open={importOpen} onClose={() => setImportOpen(false)} onImported={fetchTransactions} />

      <Modal open={Boolean(ruleSuggestion)} onClose={() => setRuleSuggestion(null)} title="Remember this?">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Always put <span className="font-semibold text-slate-900 dark:text-white">{formatCategory(ruleSuggestion?.matchText)}</span>{" "}
          under <span className="font-semibold text-slate-900 dark:text-white">{formatCategory(ruleSuggestion?.category)}</span>? This
          applies to future imports and your other matching transactions.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setRuleSuggestion(null)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Just this one
          </button>
          <button
            onClick={handleSaveRule}
            disabled={savingRule}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
          >
            {savingRule && <Loader2 className="h-4 w-4 animate-spin" />}
            Yes, always
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete transaction?"
        description="This will permanently remove this transaction. This action cannot be undone."
      />
    </div>
  );
};

export default TransactionsPage;
