"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Megaphone, Send, Loader2, Trash2, Eye, EyeOff, Mail } from "lucide-react";

import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/services/announcementService";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/Skeleton";

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-500/20";

const LEVELS = [
  { value: "info", label: "Info" },
  { value: "success", label: "Good news" },
  { value: "warning", label: "Important" },
];

const AUDIENCES = [
  { value: "users", label: "All users" },
  { value: "all", label: "Users and admins" },
  { value: "admins", label: "Admins only" },
];

const PREVIEW_STYLES = {
  info: "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
};

const EMPTY_FORM = { title: "", body: "", level: "info", audience: "users", link: "", linkLabel: "", expiresAt: "", sendEmail: false };

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const isExpired = (a) => a.expiresAt && new Date(a.expiresAt) < new Date();

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [publishing, setPublishing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await getAnnouncements();
      setAnnouncements(response.announcements);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const setField = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.warning("Give the announcement a title");
      return;
    }
    if (form.link && !form.link.startsWith("/")) {
      toast.warning("Links must be an in-app path, like /dashboard/budgets");
      return;
    }
    try {
      setPublishing(true);
      const response = await createAnnouncement({
        ...form,
        expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      });
      toast.success(response.message + (form.sendEmail ? ". Emails are being sent in the background." : ""));
      setForm(EMPTY_FORM);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish announcement");
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleActive = async (a) => {
    try {
      await updateAnnouncement(a._id, { active: !a.active });
      toast.success(a.active ? "Announcement taken down" : "Announcement re-published");
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update announcement");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      await deleteAnnouncement(deleteTarget._id);
      toast.success("Announcement deleted");
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete announcement");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Megaphone className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Announcements</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Post a banner on everyone&apos;s dashboard, with a notification and optional email.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <form
          onSubmit={handlePublish}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">New announcement</h2>
          <input value={form.title} onChange={setField("title")} maxLength={120} placeholder="Title" className={fieldClass} />
          <textarea
            value={form.body}
            onChange={setField("body")}
            maxLength={1000}
            rows={4}
            placeholder="Message (optional)"
            className={`${fieldClass} resize-none`}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Type
              <select value={form.level} onChange={setField("level")} className={`${fieldClass} mt-1 cursor-pointer`}>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Send to
              <select value={form.audience} onChange={setField("audience")} className={`${fieldClass} mt-1 cursor-pointer`}>
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Button link (optional)
              <input value={form.link} onChange={setField("link")} placeholder="/dashboard/budgets" className={`${fieldClass} mt-1`} />
            </label>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Button text
              <input value={form.linkLabel} onChange={setField("linkLabel")} placeholder="Learn more" className={`${fieldClass} mt-1`} />
            </label>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Hide after (optional)
              <input type="date" value={form.expiresAt} onChange={setField("expiresAt")} className={`${fieldClass} mt-1`} />
            </label>
          </div>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={form.sendEmail} onChange={setField("sendEmail")} className="mt-0.5 h-4 w-4 cursor-pointer accent-indigo-600" />
            <span>
              Also send by email
              <span className="block text-xs text-slate-400 dark:text-slate-500">
                Sent from your Gmail one by one in the background. Gmail allows roughly 500 emails a day.
              </span>
            </span>
          </label>
          <button
            type="submit"
            disabled={publishing}
            className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70 cursor-pointer"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </form>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Preview</p>
          <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${PREVIEW_STYLES[form.level]}`}>
            <Megaphone className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{form.title || "Your title"}</p>
              {form.body && <p className="mt-0.5 whitespace-pre-wrap text-sm opacity-90">{form.body}</p>}
              {form.link && <p className="mt-1.5 text-sm font-semibold underline underline-offset-2">{form.linkLabel || "Learn more"}</p>}
            </div>
          </div>
        </div>
      </div>

      <h2 className="mt-10 text-base font-semibold text-slate-900 dark:text-white">Published</h2>
      <div className="mt-3">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
            No announcements yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {announcements.map((a) => {
              const live = a.active && !isExpired(a);
              return (
                <li
                  key={a._id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-start dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-white">{a.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          live
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {live ? "Live" : isExpired(a) ? "Expired" : "Taken down"}
                      </span>
                    </div>
                    {a.body && <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{a.body}</p>}
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                      <span>
                        {formatDate(a.createdAt)} by {a.createdByName || "admin"}
                      </span>
                      <span>To {AUDIENCES.find((x) => x.value === a.audience)?.label.toLowerCase()}</span>
                      {a.emailed && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {a.emailedCount} emailed
                        </span>
                      )}
                      <span>{a.dismissedCount} dismissed</span>
                      {a.expiresAt && <span>Hides {formatDate(a.expiresAt)}</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleToggleActive(a)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {a.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {a.active ? "Take down" : "Re-publish"}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(a)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading}
        title="Delete announcement?"
        description={`"${deleteTarget?.title}" will be removed from everyone's dashboard. Notifications already sent stay in people's notification lists.`}
      />
    </div>
  );
};

export default AnnouncementsPage;
