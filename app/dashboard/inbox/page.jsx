"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Inbox, ArrowLeft, Send, Loader2, Plus, Headphones, MessageSquare } from "lucide-react";

import { getMyMessages, getMyMessageById, replyToMyMessage, notifyMessagesUpdated } from "@/services/messageService";
import { sendContactMessage } from "@/services/contactService";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/Skeleton";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const formatShort = (value) => {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-emerald-500/20";

const Bubble = ({ mine, author, text, time }) => (
  <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
    <div className={`max-w-[85%] sm:max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
      <p className="mb-1 px-1 text-xs text-slate-400 dark:text-slate-500">
        {author} · {formatDateTime(time)}
      </p>
      <div
        className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
          mine
            ? "rounded-br-md bg-emerald-600 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        }`}
      >
        {text}
      </div>
    </div>
  </div>
);

const InboxContent = () => {
  const searchParams = useSearchParams();
  const { user } = useSelector((state) => state.auth);

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState(searchParams.get("thread"));
  const [conversation, setConversation] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState({ subject: "", message: "" });
  const [composeSending, setComposeSending] = useState(false);

  const bottomRef = useRef(null);

  const fetchThreads = useCallback(async () => {
    try {
      const response = await getMyMessages();
      setThreads(response.threads);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  const openConversation = useCallback(async (id) => {
    try {
      setConversationLoading(true);
      const response = await getMyMessageById(id);
      setConversation(response.data);
      // opening it marks the replies as read
      setThreads((prev) => prev.map((t) => (t._id === id ? { ...t, unreadCount: 0 } : t)));
      notifyMessagesUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to open conversation");
      setSelectedId(null);
    } finally {
      setConversationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (selectedId) openConversation(selectedId);
  }, [selectedId, openConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [conversation]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      setSending(true);
      const response = await replyToMyMessage(conversation._id, replyText.trim());
      setConversation(response.data);
      setReplyText("");
      fetchThreads();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleCompose = async (e) => {
    e.preventDefault();
    if (!compose.message.trim()) {
      toast.warning("Write a message before sending");
      return;
    }
    try {
      setComposeSending(true);
      const response = await sendContactMessage({
        name: user?.username || "App user",
        email: user?.email,
        subject: compose.subject.trim() || "General",
        message: compose.message.trim(),
        source: "contact",
      });
      toast.success("Message sent to the support team");
      setComposeOpen(false);
      setCompose({ subject: "", message: "" });
      await fetchThreads();
      if (response.data?._id) setSelectedId(response.data._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setComposeSending(false);
    }
  };

  const showConversation = Boolean(selectedId);

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <div className={`flex items-start justify-between gap-3 ${showConversation ? "hidden md:flex" : "flex"}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 text-white">
            <Inbox className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My messages</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Your conversations with the support team.</p>
          </div>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New message</span>
        </button>
      </div>

      <div className="mt-6 grid min-h-0 flex-1 gap-4 md:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <div className={`min-h-0 overflow-y-auto ${showConversation ? "hidden md:block" : "block"}`}>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No messages yet.</p>
              <button
                onClick={() => setComposeOpen(true)}
                className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                Contact the support team
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {threads.map((t) => {
                const active = t._id === selectedId;
                const unread = t.unreadCount > 0;
                return (
                  <li key={t._id}>
                    <button
                      onClick={() => setSelectedId(t._id)}
                      className={`flex w-full gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                        active
                          ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/5"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          t.source === "feedback"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                        }`}
                      >
                        {t.source === "feedback" ? <MessageSquare className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate text-sm ${unread ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-800 dark:text-slate-200"}`}>
                            {t.subject}
                          </p>
                          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatShort(t.lastActivityAt)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p className={`truncate text-xs ${unread ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                            {t.lastMessage.from === "user" ? "You: " : "Support: "}
                            {t.lastMessage.text}
                          </p>
                          {unread ? (
                            <span className="shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {t.unreadCount} new
                            </span>
                          ) : (
                            t.replyCount === 0 && <span className="shrink-0 text-[10px] text-slate-400">Awaiting reply</span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Conversation */}
        <div
          className={`min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 md:flex ${
            showConversation ? "flex" : "hidden"
          }`}
        >
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
              <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">Select a conversation to read it.</p>
            </div>
          ) : conversationLoading && !conversation ? (
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-16 w-2/3 rounded-2xl" />
              <Skeleton className="ml-auto h-16 w-2/3 rounded-2xl" />
            </div>
          ) : conversation ? (
            <>
              <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <button
                  onClick={() => {
                    setSelectedId(null);
                    setConversation(null);
                  }}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden cursor-pointer"
                  aria-label="Back to messages"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{conversation.subject}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {conversation.source === "feedback" ? "Feedback" : "Support request"} · started {formatDateTime(conversation.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                <Bubble mine author="You" text={conversation.message} time={conversation.createdAt} />
                {conversation.replies?.map((r, i) =>
                  r.from === "user" ? (
                    <Bubble key={r._id || i} mine author="You" text={r.message} time={r.createdAt} />
                  ) : (
                    <Bubble key={r._id || i} author={`${r.repliedBy} · Support team`} text={r.message} time={r.createdAt} />
                  )
                )}
                {!conversation.replies?.length && (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                    The support team will reply here and by email.
                  </p>
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSendReply}
                className="flex items-end gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) handleSendReply(e);
                  }}
                  rows={1}
                  placeholder="Write a reply..."
                  className={`${fieldClass} max-h-32 resize-none`}
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  aria-label="Send reply"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="New message">
        <form onSubmit={handleCompose} className="flex flex-col gap-3">
          <input
            type="text"
            value={compose.subject}
            onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))}
            placeholder="Subject"
            maxLength={120}
            className={fieldClass}
          />
          <textarea
            value={compose.message}
            onChange={(e) => setCompose((c) => ({ ...c, message: e.target.value }))}
            rows={5}
            placeholder="How can we help?"
            className={`${fieldClass} resize-none`}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setComposeOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={composeSending}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70 cursor-pointer"
            >
              {composeSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {composeSending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// useSearchParams needs a Suspense boundary in the App Router
const InboxPage = () => (
  <Suspense fallback={null}>
    <InboxContent />
  </Suspense>
);

export default InboxPage;
