"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";

const values = [
  {
    icon: Brain,
    title: "AI-first guidance",
    description:
      "We believe financial advice should be personal, not generic. Our AI learns from your habits to coach you, not lecture you.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy by design",
    description:
      "Your financial data belongs to you. We encrypt it, never sell it, and give you full control over your information.",
  },
  {
    icon: HeartHandshake,
    title: "Built for real people",
    description:
      "No jargon, no judgment. Just clear budgets, achievable goals, and guidance that fits your actual life.",
  },
  {
    icon: Sparkles,
    title: "Always improving",
    description:
      "We're constantly refining our AI coach based on real feedback to make it more accurate and more helpful.",
  },
];

const AboutPage = () => {
  return (
    <>
      <section className="relative overflow-hidden bg-slate-50 py-20 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-emerald-300/25 blur-3xl animate-blob" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-3xl px-6 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            About AI Financial Coach
          </h1>
          <p className="mt-5 text-base text-slate-600 dark:text-slate-400">
            We started AI Financial Coach with a simple idea: everyone
            deserves a knowledgeable financial coach in their corner — not
            just people who can afford a human advisor. By combining your
            real transaction data with AI, we turn everyday spending into
            clear, actionable guidance.
          </p>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl font-bold text-slate-900 dark:text-white"
        >
          What we stand for
        </motion.h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {values.map((value, idx) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-indigo-50 text-emerald-600 dark:from-emerald-500/10 dark:to-indigo-500/10 dark:text-emerald-400">
                <value.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{value.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{value.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
};

export default AboutPage;
