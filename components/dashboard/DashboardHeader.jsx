"use client";

import React from "react";
import { Menu } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const DashboardHeader = ({ onMenuClick }) => {
  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">AI Financial Coach</span>
      </div>

      <ThemeToggle className="ml-auto" />
    </header>
  );
};

export default DashboardHeader;
