"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Plus, PieChart } from "lucide-react";

import { getBudgets, getBudgetProgress, deleteBudget } from "@/services/budgetService";
import BudgetCard from "@/components/budgets/BudgetCard";
import BudgetFormModal from "@/components/budgets/BudgetFormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/Skeleton";

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const cardVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getBudgets({ limit: 12 });
      setBudgets(response.budgets);

      response.sweptGoals?.forEach((s) => {
        if (s.onPace) {
          toast.success(`${formatCurrency(s.amountAdded)} left over from your budget was added to "${s.goalTitle}"`);
        } else if (s.amountAdded > 0) {
          toast.warning(
            `Only ${formatCurrency(s.amountAdded)} was added to "${s.goalTitle}" — you need ${formatCurrency(s.requiredMonthlyPace)}/month to hit its deadline.`
          );
        } else {
          toast.warning(
            `No money was left over for "${s.goalTitle}" this month — you need ${formatCurrency(s.requiredMonthlyPace)}/month to hit its deadline.`
          );
        }
      });

      setLoadingProgress(true);
      const progressResults = await Promise.all(
        response.budgets.map((b) =>
          getBudgetProgress(b._id)
            .then((r) => [b._id, r.budgetProgress])
            .catch(() => [b._id, null])
        )
      );
      setProgressMap(Object.fromEntries(progressResults));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load budgets");
    } finally {
      setLoading(false);
      setLoadingProgress(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const openAddModal = () => {
    setEditingBudget(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteBudget(deleteTarget._id);
      toast.success("Budget deleted");
      setDeleteTarget(null);
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete budget");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Budgets</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Set monthly spending limits and keep an eye on your progress.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-105 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New budget
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <PieChart className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
              No budgets yet. Create one to start tracking your spending limits.
            </p>
          </div>
        ) : (
          <motion.div initial="hidden" animate="show" variants={listVariants} className="flex flex-col gap-4">
            {budgets.map((budget) => (
              <motion.div key={budget._id} variants={cardVariants}>
                <BudgetCard
                  budget={budget}
                  progress={progressMap[budget._id]}
                  loadingProgress={loadingProgress}
                  onEdit={(b) => {
                    setEditingBudget(b);
                    setModalOpen(true);
                  }}
                  onDelete={setDeleteTarget}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <BudgetFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchBudgets}
        budget={editingBudget}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete budget?"
        description="This will permanently remove this budget. This action cannot be undone."
      />
    </div>
  );
};

export default BudgetsPage;
