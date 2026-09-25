import React from "react";
import { Pencil, Trash2, PieChart, Target, CheckCircle2 } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_STYLES = {
  safe: {
    bar: "from-emerald-400 to-emerald-500",
    badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    label: "On track",
  },
  warning: {
    bar: "from-amber-400 to-amber-500",
    badge: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    label: "Near limit",
  },
  over_budget: {
    bar: "from-red-400 to-red-500",
    badge: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    label: "Over budget",
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

const BudgetCard = ({ budget, progress, loadingProgress, onEdit, onDelete }) => {
  const style = STATUS_STYLES[progress?.status] || STATUS_STYLES.safe;
  const monthLabel = `${MONTH_NAMES[budget.month - 1]} ${budget.year}`;
  const percentage = progress ? Math.min(progress.percentageUsed, 100) : 0;

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <PieChart className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{monthLabel}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {formatCurrency(progress?.totalSpent)} of {formatCurrency(budget.totalBudget)} spent
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {progress && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>{style.label}</span>
          )}
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onEdit(budget)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(budget)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 cursor-pointer"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${style.bar} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {progress && (
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
            {formatCurrency(progress.remainingBudget)} remaining
          </p>
        )}
      </div>

      {(progress?.linkedGoal || budget.linkedGoal) && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          {progress?.swept ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>
                {formatCurrency(progress.sweptAmount)} moved to &ldquo;
                {(progress?.linkedGoal || budget.linkedGoal)?.title}&rdquo; when this month closed
              </span>
            </>
          ) : (
            <>
              <Target className="h-3.5 w-3.5 shrink-0" />
              <span>
                Leftover auto-saves to &ldquo;{(progress?.linkedGoal || budget.linkedGoal)?.title}&rdquo; at month end
              </span>
            </>
          )}
        </div>
      )}

      {loadingProgress ? (
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">Loading category breakdown...</p>
      ) : (
        progress?.categories?.length > 0 && (
          <div className="mt-4 flex flex-col gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            {progress.categories.map((cat) => {
              const catStyle = STATUS_STYLES[cat.status] || STATUS_STYLES.safe;
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="capitalize">{cat.category}</span>
                    <span>
                      {formatCurrency(cat.spent)} / {formatCurrency(cat.limit)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${catStyle.bar}`}
                      style={{ width: `${Math.min(cat.percentageUsed, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default BudgetCard;
