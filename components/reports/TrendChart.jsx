"use client";

import React, { useState } from "react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);

const TrendChart = ({ trends }) => {
  const [tableView, setTableView] = useState(false);

  const maxValue = Math.max(1, ...trends.flatMap((t) => [t.income, t.expenses]));

  if (tableView) {
    return (
      <div>
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => setTableView(false)}
            className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400 cursor-pointer"
          >
            View as chart
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4 font-medium">Month</th>
                <th className="py-2 pr-4 font-medium">Income</th>
                <th className="py-2 pr-4 font-medium">Expenses</th>
                <th className="py-2 font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((t) => (
                <tr key={`${t.year}-${t.month}`} className="border-b border-slate-100 dark:border-slate-800/60">
                  <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                    {t.monthName} {t.year}
                  </td>
                  <td className="py-2 pr-4 text-emerald-600 dark:text-emerald-400">{formatCurrency(t.income)}</td>
                  <td className="py-2 pr-4 text-red-600 dark:text-red-400">{formatCurrency(t.expenses)}</td>
                  <td
                    className={`py-2 font-medium ${
                      t.netCashFlow < 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {formatCurrency(t.netCashFlow)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#059669" }} />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#dc2626" }} />
            Expenses
          </span>
        </div>
        <button
          onClick={() => setTableView(true)}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
        >
          View as table
        </button>
      </div>

      <div
        className="flex items-end justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-800"
        style={{ height: 180 }}
      >
        {trends.map((t) => (
          <div key={`${t.year}-${t.month}`} className="flex flex-1 items-end justify-center gap-1">
            <div className="group relative flex flex-col items-center">
              <div
                className="w-3.5 rounded-t-[4px] transition-all sm:w-4"
                style={{ height: `${Math.max((t.income / maxValue) * 150, 2)}px`, backgroundColor: "#059669" }}
              />
              <div className="pointer-events-none absolute bottom-full mb-1.5 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white group-hover:block dark:bg-slate-700">
                Income: {formatCurrency(t.income)}
              </div>
            </div>
            <div className="group relative flex flex-col items-center">
              <div
                className="w-3.5 rounded-t-[4px] transition-all sm:w-4"
                style={{ height: `${Math.max((t.expenses / maxValue) * 150, 2)}px`, backgroundColor: "#dc2626" }}
              />
              <div className="pointer-events-none absolute bottom-full mb-1.5 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white group-hover:block dark:bg-slate-700">
                Expenses: {formatCurrency(t.expenses)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between gap-3">
        {trends.map((t) => (
          <div
            key={`${t.year}-${t.month}-label`}
            className="flex-1 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500"
          >
            {t.monthName}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendChart;
