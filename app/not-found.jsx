"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, MessageCircleQuestion } from "lucide-react";

import Logo from "@/components/Logo";
import TiltCard from "@/components/landing/TiltCard";

const NotFound = () => {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-300/25 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl animate-blob-delay" />
      </div>

      <div className="relative px-6 py-6">
        <Logo />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-12 px-6 py-12 lg:flex-row lg:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md text-center lg:text-left"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
            Error 404
          </span>

          <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Off the <span className="bg-gradient-to-r from-emerald-500 to-indigo-600 bg-clip-text text-transparent">chart.</span>
          </h1>

          <p className="mt-5 text-base text-slate-600 dark:text-slate-400">
            The page you&apos;re looking for doesn&apos;t add up. It may have
            been moved, renamed, or never existed in the first place.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:brightness-105"
            >
              <Home className="h-4 w-4" />
              Back to home
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              <MessageCircleQuestion className="h-4 w-4" />
              Contact support
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-xs"
          style={{ perspective: 1000 }}
        >
          <TiltCard className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Page performance</p>
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                Not found
              </span>
            </div>

            <div className="mt-6 flex items-end gap-2.5" style={{ transform: "translateZ(30px)" }}>
              {[68, 54, 40, 27, 15, 4].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-slate-300 to-slate-200"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>

            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500" style={{ transform: "translateZ(20px)" }}>
              This route trended straight to zero.
            </p>
          </TiltCard>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-6 -right-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">404 · Not budgeted 💸</p>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
};

export default NotFound;
