"use client";

import React, { useState } from "react";
import { ExternalLink, Loader2, CheckCircle2, Search, AlertTriangle } from "lucide-react";

import Modal from "@/components/ui/Modal";
import { normalizeLink, cancelSearchUrl, siteName, linkMatchesName } from "@/lib/cancelLinks";

const primaryLinkClass =
  "inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700";

// Only the company can end a subscription, so this takes the user there first,
// then records it here once they say it's done. Render it with a `key` per
// subscription so the link box starts fresh each time.
const CancelSubscriptionModal = ({ subscription, onClose, onConfirm, onSaveLink, busy }) => {
  const [linkText, setLinkText] = useState("");
  const [linkError, setLinkError] = useState("");
  const [editingLink, setEditingLink] = useState(false);

  const name = subscription?.name || "";
  const savedLink = subscription?.manageUrl || "";
  const showLinkForm = !savedLink || editingLink;

  const handleSaveLink = async (e) => {
    e.preventDefault();
    const link = normalizeLink(linkText);
    if (!link) {
      setLinkError("Enter a website link, like udemy.com/settings");
      return;
    }
    setLinkError("");
    if (await onSaveLink(link)) {
      setLinkText("");
      setEditingLink(false);
    }
  };

  return (
    <Modal open={Boolean(subscription)} onClose={onClose} title={`Cancel ${name}`}>
      {subscription && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Step 1: Cancel it with {name}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Only {name} can stop the charges, so you&apos;ll finish this on their website.
            </p>

            {savedLink && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <a href={savedLink} target="_blank" rel="noopener noreferrer" className={primaryLinkClass}>
                  <ExternalLink className="h-4 w-4 shrink-0" /> Open {name}&apos;s website
                </a>
                {!editingLink && (
                  <button
                    onClick={() => {
                      setLinkText(savedLink);
                      setEditingLink(true);
                    }}
                    className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Change link
                  </button>
                )}
              </div>
            )}

            {savedLink && (
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Opens <span className="font-semibold">{siteName(savedLink)}</span>
              </p>
            )}

            {savedLink && !linkMatchesName(savedLink, name) && (
              <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This address doesn&apos;t mention {name}. Make sure it&apos;s the right website before signing in or entering any details.
              </p>
            )}

            {showLinkForm && (
              <form onSubmit={handleSaveLink} className="mt-3">
                <label htmlFor="cancel-link" className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Company website or cancel page
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  <input
                    id="cancel-link"
                    value={linkText}
                    onChange={(e) => {
                      setLinkText(e.target.value);
                      setLinkError("");
                    }}
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    maxLength={500}
                    placeholder="e.g. udemy.com/settings"
                    className="min-w-0 flex-1 basis-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-500/20"
                  />
                  <button
                    type="submit"
                    disabled={busy || !linkText.trim()}
                    className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Save link
                  </button>
                </div>
                {linkError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{linkError}</p>}
              </form>
            )}

            {!savedLink && (
              <a
                href={cancelSearchUrl(name)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 underline underline-offset-2 dark:text-emerald-400"
              >
                <Search className="h-3.5 w-3.5" /> Don&apos;t have the link? Search how to cancel {name}
              </a>
            )}

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              If you signed up through the App Store or Google Play, you may need to cancel it there instead.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Step 2: Come back and confirm</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              We&apos;ll stop your reminders and take it out of your totals. If {name} charges you again, we&apos;ll warn you here.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Not yet
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 dark:text-emerald-400 dark:hover:bg-emerald-500/10 cursor-pointer"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {busy ? "Saving..." : "I've cancelled it"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CancelSubscriptionModal;
