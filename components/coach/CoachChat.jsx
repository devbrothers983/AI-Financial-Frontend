"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Sparkles, Send, Loader2, RotateCcw } from "lucide-react";

import { getCoachChat, sendCoachMessage, clearCoachChat } from "@/services/coachService";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/Skeleton";

const SUGGESTIONS = [
  "Why did I overspend this month?",
  "Where is most of my money going?",
  "How does this month compare with last month?",
  "What could I cut back on?",
  "Am I on track for my goals?",
  "How much do my subscriptions cost?",
];

const CoachChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    getCoachChat()
      .then((response) => setMessages(response.messages))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load your conversation"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, sending]);

  const ask = async (text) => {
    const message = text.trim();
    if (!message || sending) return;

    // shown straight away, and replaced by the saved copy once answered
    const pending = { _id: "pending", role: "user", content: message };
    setMessages((prev) => [...prev, pending]);
    setQuestion("");

    try {
      setSending(true);
      const response = await sendCoachMessage(message);
      setMessages((prev) => [...prev.filter((m) => m._id !== "pending"), ...response.messages]);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== "pending"));
      setQuestion(message);
      toast.error(err.response?.data?.message || "The coach couldn't answer right now. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    ask(question);
  };

  const handleClear = async () => {
    try {
      setClearing(true);
      await clearCoachChat();
      setMessages([]);
      setClearOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't clear the conversation");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {messages.length > 0 && (
        <div className="flex justify-end border-b border-slate-100 px-3 py-2 dark:border-slate-800">
          <button
            onClick={() => setClearOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Start over
          </button>
        </div>
      )}

      <div className="flex max-h-[60vh] min-h-72 flex-col gap-4 overflow-y-auto p-4">
        {loading ? (
          <>
            <Skeleton className="h-14 w-2/3 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
          </>
        ) : messages.length === 0 && !sending ? (
          <div className="m-auto max-w-md text-center">
            <Sparkles className="mx-auto h-7 w-7 text-emerald-500" />
            <p className="mt-2 font-medium text-slate-800 dark:text-slate-200">Ask me anything about your money</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">I&apos;ll answer using your own transactions, budget and goals.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => ask(suggestion)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-emerald-400 cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={m._id || `${m.role}-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "rounded-br-md bg-emerald-600 text-white"
                    : "rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Looking at your numbers...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
        <textarea
          id="coach-question"
          aria-label="Your question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) handleSubmit(e);
          }}
          rows={1}
          maxLength={1000}
          placeholder="e.g. Why did I overspend this month?"
          className="max-h-32 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-emerald-500/20"
        />
        <button
          type="submit"
          disabled={sending || !question.trim()}
          aria-label="Send question"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        AI can make mistakes. Your question and a summary of your finances are sent to our AI provider to answer you. Your name and
        email aren&apos;t included.
      </p>

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={handleClear}
        loading={clearing}
        loadingLabel="Clearing..."
        confirmLabel="Start over"
        title="Start a new conversation?"
        description="This permanently deletes your conversation with the coach. Your financial data isn't affected."
      />
    </div>
  );
};

export default CoachChat;
