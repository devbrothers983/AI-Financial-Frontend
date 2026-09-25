import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

const Logo = ({ variant = "dark", size = "md", compact = false }) => {
  const textColor = variant === "light" ? "text-white" : "text-slate-900 dark:text-white";
  const sizeClasses = size === "lg" ? "text-2xl" : "text-lg";

  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 select-none transition-opacity hover:opacity-80"
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 shadow-lg shadow-emerald-500/20">
        <Sparkles className="h-4 w-4 text-white" strokeWidth={2.25} />
      </span>
      {!compact && (
        <span className={`font-bold tracking-tight ${sizeClasses} ${textColor}`}>
          AI Financial <span className="text-emerald-500">Coach</span>
        </span>
      )}
    </Link>
  );
};

export default Logo;
