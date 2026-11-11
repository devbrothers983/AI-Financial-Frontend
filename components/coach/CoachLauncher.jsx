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
          title="Ask the AI Coach"
          className="fixed right-5 z-40 rounded-xl p-1 text-emerald-600 drop-shadow-lg transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-emerald-400 cursor-pointer"
          style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <BotMessageSquare className="h-11 w-11" strokeWidth={1.75} />
        </button>
      )}
    </>
  );
};

export default CoachLauncher;
