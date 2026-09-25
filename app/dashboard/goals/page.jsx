"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Plus, Target } from "lucide-react";

import { getGoals, deleteGoal } from "@/services/goalService";
import GoalCard from "@/components/GoalCard";
import GoalFormModal from "@/components/goals/GoalFormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/Skeleton";

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const cardVariants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

const selectClass =
  "cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:ring-emerald-500/20";

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "active", priority: "" });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;

      const response = await getGoals(params);
      setGoals(response.goals);

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
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openAddModal = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteGoal(deleteTarget._id);
      toast.success("Goal deleted");
      setDeleteTarget(null);
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete goal");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Goals</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Set savings targets and track your progress toward them.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-105 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New goal
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select name="status" value={filters.status} onChange={handleFilterChange} className={selectClass}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>

        <select name="priority" value={filters.priority} onChange={handleFilterChange} className={selectClass}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <Target className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
              No goals match these filters yet. Create one to start tracking progress.
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={listVariants}
            className="grid gap-4 sm:grid-cols-2"
          >
            {goals.map((goal) => (
              <motion.div key={goal._id} variants={cardVariants}>
                <GoalCard
                  goal={goal}
                  onEdit={(g) => {
                    setEditingGoal(g);
                    setModalOpen(true);
                  }}
                  onDelete={setDeleteTarget}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <GoalFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchGoals}
        goal={editingGoal}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete goal?"
        description="This will permanently remove this goal. This action cannot be undone."
      />
    </div>
  );
};

export default GoalsPage;
