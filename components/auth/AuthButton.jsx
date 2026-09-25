import React from "react";
import { Loader2 } from "lucide-react";

const AuthButton = ({ loading, children, className = "", ...props }) => {
  return (
    <button
      disabled={loading}
      className={`relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-emerald-500/30 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

export default AuthButton;
