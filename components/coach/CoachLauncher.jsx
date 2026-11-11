"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Maximize2, BotMessageSquare } from "lucide-react";

import CoachChat from "@/components/coach/CoachChat";
import { getViewAs } from "@/lib/viewAs";

// A button in the corner of every dashboard page that opens the AI coach in a
// panel, so users can ask a question without leaving what they're looking at.
const CoachLauncher = () => {
  const pathname = usePathname();
  const { user, hydrated } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  // read once; nothing is rendered until sign-in is restored, so server and browser still match
  const [viewingAs] = useState(() => typeof window !== "undefined" && Boolean(getViewAs()));

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // the coach is for users; the coach page already has it; a read-only view can't ask
  const hidden = !hydrated || user?.role !== "user" || pathname.startsWith("/dashboard/coach") || viewingAs;
  if (hidden) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-label="AI Coach"
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white shadow-2xl sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[min(600px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-slate-200 dark:bg-slate-900 sm:dark:border-slate-800"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">AI Coach</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ask anything about your money</p>
              </div>
              <Link
                href="/dashboard/coach"
                onClick={() => setOpen(false)}
                aria-label="Open the full coach page"
                title="Open the full coach page"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close AI Coach"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <CoachChat fill />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ask the AI Coach"
          className="group fixed right-5 z-40 flex items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500 cursor-pointer"
          style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {/* label that slides out on hover or keyboard focus (not shown on touch screens) */}
          <span className="pointer-events-none hidden translate-x-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:block dark:bg-white dark:text-slate-900">
            Ask AI Coach
          </span>

          <span className="relative flex h-14 w-14 items-center justify-center">
            {/* a soft pulse that draws the eye; skipped for people who prefer less motion */}
            <span className="absolute inset-0 rounded-full bg-emerald-400/40 motion-safe:animate-ping [animation-duration:2.4s]" />

            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-indigo-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-white transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 dark:ring-slate-900">
              <BotMessageSquare className="h-7 w-7" strokeWidth={1.75} />
            </span>

            {/* AI sparkle badge */}
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-amber-500 shadow-md dark:bg-slate-900 dark:text-amber-400">
              <Sparkles className="h-3 w-3" fill="currentColor" />
            </span>

            {/* online dot */}
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 dark:border-slate-900" />
          </span>
        </button>
      )}
    </>
  );
};

export default CoachLauncher;
