"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Wallet, Target } from "lucide-react";
import TiltCard from "./TiltCard";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: "easeOut" },
  }),
};

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl animate-blob" />
        <div className="absolute top-1/4 -right-24 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl animate-blob-delay" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-2">
        <div>
          <motion.span
            initial="hidden"
            animate="show"
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            AI-powered financial coaching
          </motion.span>

          <motion.h1
            initial="hidden"
            animate="show"
            custom={0.1}
            variants={fadeUp}
            className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white md:text-5xl"
          >
            Master your money with a coach that never sleeps.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            custom={0.2}
            variants={fadeUp}
            className="mt-5 max-w-lg text-base text-slate-600 dark:text-slate-400"
          >
            AI Financial Coach turns your transactions into clear budgets,
            achievable goals, and personalized advice — so every decision
            about your money is backed by data, not guesswork.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            custom={0.3}
            variants={fadeUp}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:brightness-105"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Learn more
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-md"
          style={{ perspective: 1000 }}
        >
          <TiltCard className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Overview</p>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                +12.4%
              </span>
            </div>

            <div className="mt-6 flex items-end gap-2.5" style={{ transform: "translateZ(30px)" }}>
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-400 to-indigo-500" style={{ height: `${h}px` }} />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3" style={{ transform: "translateZ(20px)" }}>
              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Wallet className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Savings</span>
                </div>
                <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">$2,480</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Target className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Goal</span>
                </div>
                <p className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">68%</p>
              </div>
            </div>
          </TiltCard>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-6 -left-6 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">AI insight</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">You&apos;re on track 🎯</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
