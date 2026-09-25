"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-indigo-600 px-8 py-14 text-center shadow-2xl shadow-emerald-500/20"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-blob" />
          <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl animate-blob-delay" />
        </div>

        <h2 className="relative text-3xl font-bold text-white md:text-4xl">
          Ready to take control of your finances?
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-sm text-emerald-50">
          Join AI Financial Coach today and start building smarter money habits.
        </p>
        <Link
          href="/register"
          className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition-transform hover:scale-105"
        >
          Create your free account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
};

export default CTASection;
