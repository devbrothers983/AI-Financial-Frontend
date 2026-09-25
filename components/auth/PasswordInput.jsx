"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

const getStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"];

const PasswordInput = ({ label, error, showStrength = false, value = "", className = "", ...props }) => {
  const [visible, setVisible] = useState(false);
  const strength = showStrength && value ? getStrength(value) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={props.id || props.name} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          id={props.id || props.name}
          type={visible ? "text" : "password"}
          value={value}
          className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500
            ${error
              ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-500/20"
              : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-500/20"}
            ${className}`}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && value && (
        <div className="flex flex-col gap-1 pt-0.5">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i < strength ? STRENGTH_COLORS[strength - 1] : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">{STRENGTH_LABELS[Math.max(strength - 1, 0)]}</p>
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
};

export default PasswordInput;
