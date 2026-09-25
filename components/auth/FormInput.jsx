import React from "react";

const FormInput = ({ icon: Icon, label, error, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={props.id || props.name} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        )}
        <input
          id={props.id || props.name}
          className={`w-full rounded-xl border bg-white py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500
            ${Icon ? "pl-10" : "pl-3.5"} pr-3.5
            ${error
              ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-500/20"
              : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-500/20"}
            ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
};

export default FormInput;
