"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { MessageSquare, Send, Loader2 } from "lucide-react";

import { sendContactMessage } from "@/services/contactService";

const FEEDBACK_TYPES = ["General feedback", "Bug report", "Feature request"];

const inputClass = (hasError) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 ${
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-500/20"
      : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-500/20"
  }`;

const FeedbackPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ type: FEEDBACK_TYPES[0], message: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      setError("Please share your feedback");
      toast.warning("Please fix the errors below");
      return;
    }

    try {
      setLoading(true);
      await sendContactMessage({
        name: user?.username || "App user",
        email: user?.email,
        subject: formData.type,
        message: formData.message,
        source: "feedback",
      });
      toast.success("Thanks! Your feedback has been sent.");
      setFormData({ type: FEEDBACK_TYPES[0], message: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 text-white">
          <MessageSquare className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Feedback</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Tell us what&apos;s working, what&apos;s not, or what you&apos;d like to see next.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
            className={`cursor-pointer ${inputClass(false)}`}
          >
            {FEEDBACK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Your feedback</label>
          <textarea
            value={formData.message}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, message: e.target.value }));
              setError("");
            }}
            rows={5}
            maxLength={1000}
            placeholder="Share your thoughts..."
            className={`resize-none ${inputClass(Boolean(error))}`}
          />
          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {loading ? "Sending..." : "Send feedback"}
        </button>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Sends directly to our support inbox — we read every message.
        </p>
      </form>
    </div>
  );
};

export default FeedbackPage;
