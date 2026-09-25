"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Mail, Send, LifeBuoy, Loader2 } from "lucide-react";

import { sendContactMessage } from "@/services/contactService";

const SUBJECTS = [
  "Account creation problem",
  "Login / access issue",
  "Billing question",
  "General feedback",
  "Other",
];

const SUPPORT_EMAIL = "devbrothers1002@gmail.com";

const inputClass = (hasError) =>
  `rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-500/20"
      : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-500/20"
  }`;

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: SUBJECTS[0],
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { name, email, subject, message } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Your name is required";
    if (!email) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email";
    if (!message.trim()) errs.message = "Please describe your issue";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning("Please fill in all fields correctly");
      return;
    }

    try {
      setLoading(true);
      await sendContactMessage({ name, email, subject, message, source: "contact" });

      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: SUBJECTS[0], message: "" });
    } catch (err) {
      const errMessage = err.response?.data?.message || "Failed to send message. Please try again.";
      toast.error(errMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl animate-blob" />
      </div>

      <div className="relative mx-auto grid max-w-5xl gap-10 px-6 lg:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-2"
        >
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Contact the admin
          </h1>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            Having trouble creating an account, logging in, or something
            else? Send us a message and we&apos;ll help you sort it out.
          </p>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Email support</p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Account issues</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Trouble registering or signing in? Include your email address
                so we can look up your account.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-3"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Your name
              </label>
              <input
                id="name"
                name="name"
                value={name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className={inputClass(errors.name)}
              />
              {errors.name && <p className="text-xs font-medium text-red-500">{errors.name}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={inputClass(errors.email)}
              />
              {errors.email && <p className="text-xs font-medium text-red-500">{errors.email}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="subject" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              What's this about?
            </label>
            <select
              id="subject"
              name="subject"
              value={subject}
              onChange={handleChange}
              className={inputClass(false)}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={message}
              onChange={handleChange}
              placeholder="Describe the issue you're facing..."
              className={`resize-none ${inputClass(errors.message)}`}
            />
            {errors.message && <p className="text-xs font-medium text-red-500">{errors.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "Sending..." : "Send message"}
          </button>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Sends directly to our support inbox — we&apos;ll reply to the email address you provide.
          </p>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactPage;
