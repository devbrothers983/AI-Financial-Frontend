import React from "react";
import { Target, Pencil, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";

const PRIORITY_STYLES = {
    high: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    medium: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    low: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

const formatDate = (value) =>
    new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const GoalCard = ({ goal, onEdit, onDelete }) => {
    const progress = goal.targetAmount > 0
        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
        : 0;
    const isCompleted = goal.status === "completed";
    const showActions = Boolean(onEdit || onDelete);
    const isOffTrack = !isCompleted && goal.pace?.isOffTrack;

    return (
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{goal.title}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {isCompleted ? "Completed" : `Target ${formatDate(goal.targetDate)}`}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                    {isOffTrack && (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            <AlertTriangle className="h-3 w-3" />
                            Off track
                        </span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${PRIORITY_STYLES[goal.priority] || PRIORITY_STYLES.low}`}>
                        {goal.priority}
                    </span>

                    {showActions && (
                        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(goal)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                                    aria-label="Edit"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(goal)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 cursor-pointer"
                                    aria-label="Delete"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatCurrency(goal.currentAmount)} saved</span>
                    <span>{formatCurrency(goal.targetAmount)} goal</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="mt-1.5 text-right text-xs font-medium text-slate-500 dark:text-slate-400">{progress.toFixed(0)}%</p>
                {isOffTrack && goal.pace?.requiredMonthlyPace > 0 && (
                    <p className="mt-1 text-right text-xs font-medium text-red-500 dark:text-red-400">
                        Needs {formatCurrency(goal.pace.requiredMonthlyPace)}/mo to catch up
                    </p>
                )}
            </div>
        </div>
    );
};

export default GoalCard;
