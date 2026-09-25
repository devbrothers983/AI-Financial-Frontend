"use client";

import React from "react";
import { motion } from "framer-motion";
import { UserPlus, LinkIcon, Sparkles } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create your account",
    description: "Sign up in seconds and tell us a little about your financial goals.",
  },
  {
    icon: LinkIcon,
    title: "Add your transactions",
    description: "Log your income, expenses and budgets to build your financial picture.",
  },
  {
    icon: Sparkles,
    title: "Get AI-powered guidance",
    description: "Receive tailored insights and coaching that adapt as your habits change.",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-slate-900 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white">How it works</h2>
          <p className="mt-3 text-slate-400">Three simple steps to a healthier financial life.</p>
        </motion.div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <span className="absolute -top-4 -left-2 text-6xl font-bold text-white/5">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-500">
                <step.icon className="h-5 w-5 text-white" />
              </span>
              <h3 className="relative mt-4 text-base font-semibold text-white">{step.title}</h3>
              <p className="relative mt-2 text-sm text-slate-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
