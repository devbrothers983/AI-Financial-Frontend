"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, PiggyBank, LineChart, Target, ShieldCheck, Bell } from "lucide-react";
import TiltCard from "./TiltCard";

const features = [
  {
    icon: Brain,
    title: "AI-driven coaching",
    description: "Get personalized recommendations based on your real spending patterns, not generic tips.",
  },
  {
    icon: PiggyBank,
    title: "Smart budgeting",
    description: "Set flexible budgets by category and get nudged before you go over.",
  },
  {
    icon: LineChart,
    title: "Spending insights",
    description: "Visualize where your money goes with clear, actionable transaction breakdowns.",
  },
  {
    icon: Target,
    title: "Goal tracking",
    description: "Set savings goals and watch your progress update automatically as you save.",
  },
  {
    icon: Bell,
    title: "Timely alerts",
    description: "Stay ahead of due dates and unusual spending with proactive notifications.",
  },
  {
    icon: ShieldCheck,
    title: "Private & secure",
    description: "Your financial data is encrypted and never sold or shared with third parties.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const Features = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Everything you need to feel in control
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          A complete toolkit that turns everyday transactions into a clear
          financial plan.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((feature) => (
          <motion.div key={feature.title} variants={item} style={{ perspective: 800 }}>
            <TiltCard className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/20">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-indigo-50 text-emerald-600 transition-transform group-hover:scale-110 dark:from-emerald-500/10 dark:to-indigo-500/10 dark:text-emerald-400">
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
            </TiltCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default Features;
