import React from "react";
import Skeleton from "./Skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="mt-8 flex flex-col gap-8">
      <div className="grid gap-5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="mt-3 h-7 w-24" />
          </div>
        ))}
      </div>

      <div>
        <Skeleton className="mb-3 h-4 w-40" />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-2.5 w-full rounded-full" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      </div>

      <div>
        <Skeleton className="mb-3 h-4 w-28" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="mt-1.5 h-3 w-20" />
                </div>
              </div>
              <Skeleton className="mt-4 h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="mb-3 h-4 w-44" />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="mt-1.5 h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
