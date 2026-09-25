"use client";

import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Logo from "../Logo";
import { TrendingUp, ShieldCheck, Brain } from "lucide-react";

const highlights = [
  {
    icon: Brain,
    title: "AI-powered insights",
    description: "Personalized coaching that learns your spending habits.",
  },
  {
    icon: TrendingUp,
    title: "Smarter budgeting",
    description: "Track goals, budgets and transactions in one dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-grade security",
    description: "Your financial data is encrypted and never shared.",
  },
];

const AuthLayout = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <main className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950">
        {/* Left brand panel */}
        <div className="relative hidden w-1/2 overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-emerald-500/30 blur-3xl animate-blob" />
            <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl animate-blob-delay" />
            <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl animate-blob-delay-2" />
          </div>

          <div className="relative z-10 animate-fade-in">
            <Logo variant="light" size="lg" />
          </div>

          <div className="relative z-10 max-w-md animate-fade-in-up">
            <h2 className="text-3xl font-bold leading-tight text-white">
              Take control of your money with your personal AI coach.
            </h2>
            <p className="mt-4 text-sm text-slate-300">
              Track spending, hit your savings goals, and get real-time
              financial guidance tailored to you.
            </p>

            <div className="mt-10 flex flex-col gap-5">
              {highlights.map((item, idx) => (
                <div
                  key={item.title}
                  className={`flex items-start gap-4 animate-fade-in-up animation-delay-${(idx + 1) * 100}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                    <item.icon className="h-5 w-5 text-emerald-400" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-slate-500 animate-fade-in">
            © {new Date().getFullYear()} AI Financial Coach. All rights reserved.
          </p>
        </div>

        {/* Right form panel */}
        <div className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
          <div className="mb-8 lg:hidden">
            <Logo size="lg" />
          </div>
          <div className="w-full max-w-sm animate-fade-in-up">{children}</div>
        </div>
      </main>
    </GoogleOAuthProvider>
  );
};

export default AuthLayout;
