import React from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Your personal AI-powered coach for budgeting, saving and building
            healthier financial habits.
          </p>
        </div>

        <div className="flex flex-wrap gap-12">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Product</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">Home</Link></li>
              <li><Link href="/about" className="hover:text-emerald-600 dark:hover:text-emerald-400">About</Link></li>
              <li><Link href="/register" className="hover:text-emerald-600 dark:hover:text-emerald-400">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Support</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/contact" className="hover:text-emerald-600 dark:hover:text-emerald-400">Contact Admin</Link></li>
              <li><Link href="/login" className="hover:text-emerald-600 dark:hover:text-emerald-400">Sign in</Link></li>
            </ul>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Get in touch</p>
          <a
            href="mailto:devbrothers1002@gmail.com"
            className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
          >
            <Mail className="h-4 w-4" />
            devbrothers1002@gmail.com
          </a>
        </div>
      </div>

      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        © {new Date().getFullYear()} AI Financial Coach. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
