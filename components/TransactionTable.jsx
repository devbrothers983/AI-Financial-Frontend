import React from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
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
} from "lucide-react";

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
    other: MoreHorizontal,
};

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

const formatDate = (value) =>
    new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const TransactionTable = ({ transactions = [] }) => {
    if (transactions.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                No transactions yet.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((transaction) => {
                    const Icon = CATEGORY_ICONS[transaction.transactionCategory] || MoreHorizontal;
                    const isIncome = transaction.transactionType === "income";

                    return (
                        <li key={transaction._id} className="flex items-center gap-3 px-5 py-4">
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
                            </div>

                            <div className={`flex shrink-0 items-center gap-1 text-sm font-semibold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                                {isIncome ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
                                {isIncome ? "+" : "-"}{formatCurrency(transaction.transactionAmount)}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default TransactionTable;
