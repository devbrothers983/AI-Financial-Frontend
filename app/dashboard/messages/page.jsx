"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Mail, MailOpen, Trash2, Inbox, Headphones, MessageSquare, Reply, Send, Loader2, CornerDownRight } from "lucide-react";

import { getAllMessages, updateMessageReadStatus, replyToMessage, deleteMessage } from "@/services/adminService";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/Skeleton";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const SOURCE_FILTERS = [
  { value: "", label: "All" },
  { value: "contact", label: "Contact form" },
  { value: "feedback", label: "In-app feedback" },
];

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [openReplyId, setOpenReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (sourceFilter) params.source = sourceFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await getAllMessages(params);
      setMessages(response.messages);
      setUnreadCount(response.unreadCount);
      setPagination(response.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [page, sourceFilter, statusFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    setPage(1);
  }, [sourceFilter, statusFilter]);

  const handleToggleRead = async (msg) => {
    try {
      await updateMessageReadStatus(msg._id, !msg.isRead);
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update message");
    }
  };

  const handleToggleReply = (msg) => {
    if (openReplyId === msg._id) {
      setOpenReplyId(null);
      setReplyText("");
    } else {
      setOpenReplyId(msg._id);
      setReplyText("");
    }
  };

  const handleSendReply = async (msg) => {
    if (!replyText.trim()) {
      toast.warning("Write a reply before sending");
      return;
    }

    try {
      setSendingReply(true);
      await replyToMessage(msg._id, replyText.trim());
      toast.success(`Reply sent to ${msg.email}`);
      setOpenReplyId(null);
      setReplyText("");
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      await deleteMessage(deleteTarget._id);
      toast.success("Message deleted");
      setDeleteTarget(null);
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete message");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 text-white">
          <Inbox className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Messages</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Contact form submissions and in-app feedback from users
            {unreadCount > 0 && <span className="font-semibold text-indigo-600 dark:text-indigo-400"> — {unreadCount} unread</span>}.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <div className="flex gap-2">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSourceFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                sourceFilter === f.value
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === f.value
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">No messages match these filters.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`rounded-2xl border p-5 dark:border-slate-800 dark:bg-slate-900 ${
                  msg.isRead ? "border-slate-200 bg-white" : "border-indigo-200 bg-indigo-50/40 dark:border-indigo-500/30 dark:bg-indigo-500/5"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        msg.source === "feedback"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                      }`}
                    >
                      {msg.source === "feedback" ? <MessageSquare className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {msg.name} <span className="font-normal text-slate-400">&lt;{msg.email}&gt;</span>
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {msg.source === "feedback" ? "In-app feedback" : "Contact form"} · {formatDateTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => handleToggleReply(msg)}
                      title="Reply"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      <Reply className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleRead(msg)}
                      title={msg.isRead ? "Mark as unread" : "Mark as read"}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {msg.isRead ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(msg)}
                      title="Delete"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">{msg.subject}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">{msg.message}</p>

                {msg.replies?.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {msg.replies.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                        <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <div>
                          <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-400">{r.message}</p>
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            {r.repliedBy} · {formatDateTime(r.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {openReplyId === msg._id && (
                  <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder={`Reply to ${msg.name}...`}
                      className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-500/20"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleReply(msg)}
                        className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendReply(msg)}
                        disabled={sendingReply}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                      >
                        {sendingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {sendingReply ? "Sending..." : "Send reply"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages} — {pagination.totalMessages} messages
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={pagination.currentPage <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading}
        title="Delete message?"
        description="This will permanently remove this message. This action cannot be undone."
      />
    </div>
  );
};

export default MessagesPage;
