import React from "react";

const Skeleton = ({ className = "", dark = false }) => (
  <div
    className={`animate-shimmer rounded-md bg-gradient-to-r bg-[length:200%_100%] ${
      dark ? "from-slate-700 via-slate-600 to-slate-700" : "from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"
    } ${className}`}
  />
);

export default Skeleton;
