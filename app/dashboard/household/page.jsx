"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Home, Plus, Mail, Loader2, Pencil, Check, X, LogOut, Trash2, UserMinus, Lock, Eye, BarChart3, Crown } from "lucide-react";

import {
  getHousehold,
  createHousehold,
  renameHousehold,
  deleteHousehold,
  updateMySharing,
  leaveHousehold,
  removeHouseholdMember,
  inviteToHousehold,
  cancelHouseholdInvite,
  acceptHouseholdInviteByToken,
  acceptHouseholdInvite,
  declineHouseholdInvite,
} from "@/services/householdService";
import { formatCategory } from "@/lib/useCategories";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/Skeleton";

const SHARE_OPTIONS = [
  { value: "none", icon: Lock, title: "Nothing", text: "Others in the household see only your name." },
  { value: "totals", icon: BarChart3, title: "Monthly totals", text: "Your total income and spending this month, with no details." },
  { value: "transactions", icon: Eye, title: "Everything", text: "Your totals, spending by category, and your individual transactions." },
];

const SHARE_LABEL = { none: "Not sharing", totals: "Sharing totals", transactions: "Sharing everything" };

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-500/20";

const primaryButton =
  "flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer";

const secondaryButton =
  "flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer";

const card = "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";

const formatDate = (value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const moneyIn = (currency) => (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(value || 0);

const Tile = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-1 truncate text-xl font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
);

const HouseholdPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [newName, setNewName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [inviteToken, setInviteToken] = useState(null);

  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await getHousehold());
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load your household");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // arrived from the invitation email
    const token = new URLSearchParams(window.location.search).get("invite");
    if (token) setInviteToken(token);
  }, [load]);

  const run = async (action) => {
    try {
      setBusy(true);
      const response = await action();
      toast.success(response.message);
      await load();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const clearInviteLink = () => {
    setInviteToken(null);
    window.history.replaceState(null, "", "/dashboard/household");
  };

  const household = data?.household;
  const summary = household?.summary;
  const money = moneyIn(summary?.currency);

  const confirmCopy = {
    leave: {
      title: "Leave this household?",
      description: household?.isOwner
        ? "The longest-standing member becomes the owner. If no one else is in it, the household is deleted. Your own data isn't affected."
        : "You'll stop seeing the household's shared view, and they'll stop seeing anything you shared. Your own data isn't affected.",
      label: "Leave",
      action: leaveHousehold,
    },
    delete: {
      title: "Delete this household?",
      description: "Everyone is removed and the shared view is gone. Each person's own data isn't affected.",
      label: "Delete household",
      action: deleteHousehold,
    },
    remove: {
      title: `Remove ${confirm?.member?.name}?`,
      description: "They'll stop seeing the household, and you'll stop seeing anything they shared. Their own data isn't affected.",
      label: "Remove",
      action: () => removeHouseholdMember(confirm.member.userId),
    },
  }[confirm?.type];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 text-white">
          <Home className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-slate-900 dark:text-white">{household?.name || "Household"}</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Share a view of your money with the people you live with.</p>
        </div>
      </div>

      {inviteToken && (
        <div className={`${card} mt-6 border-emerald-200 dark:border-emerald-500/30`}>
          <p className="font-semibold text-slate-900 dark:text-white">You have a household invitation</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Joining shares nothing at first. You choose what others can see after you join.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={async () => {
                if (await run(() => acceptHouseholdInviteByToken(inviteToken))) clearInviteLink();
              }}
              disabled={busy}
              className={primaryButton}
            >
              <Check className="h-4 w-4" /> Accept invitation
            </button>
            <button onClick={clearInviteLink} className={secondaryButton}>
              Not now
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : !data ? null : !household ? (
        <div className="mt-6 flex flex-col gap-6">
          {data.myInvites.length > 0 && (
            <section className={card}>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Invitations for you</h2>
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {data.myInvites.map((invite) => (
                  <li key={invite._id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{invite.householdName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        From {invite.invitedByName} · expires {formatDate(invite.expiresAt)}
                      </p>
                    </div>
                    {invite.canAcceptHere ? (
                      <button onClick={() => run(() => acceptHouseholdInvite(invite._id))} disabled={busy} className={primaryButton}>
                        Join
                      </button>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Open the link in your invitation email to join.</p>
                    )}
                    <button onClick={() => run(() => declineHouseholdInvite(invite._id))} disabled={busy} className={secondaryButton}>
                      Decline
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={card}>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Start a household</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Invite a partner or family by email. Each person chooses what to share, and nothing is shared at first.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await run(() => createHousehold(newName))) setNewName("");
              }}
              className="mt-4 flex flex-wrap gap-3"
            >
              <input
                id="household-name"
                aria-label="Household name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={60}
                required
                placeholder="e.g. The Khan family"
                className={`${fieldClass} min-w-0 flex-1 basis-48`}
              />
              <button type="submit" disabled={busy} className={primaryButton}>
                <Plus className="h-4 w-4" /> Create household
              </button>
            </form>
          </section>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <section className={card}>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">What you share</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">You can change this at any time. It only affects your own data.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {SHARE_OPTIONS.map((option) => {
                const selected = household.myShareLevel === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => !selected && run(() => updateMySharing(option.value))}
                    disabled={busy}
                    aria-pressed={selected}
                    className={`rounded-xl border p-3 text-left transition-colors disabled:opacity-60 cursor-pointer ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-500/10"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                    }`}
                  >
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                      <option.icon className="h-4 w-4" /> {option.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{option.text}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{household.month}</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {summary.sharingCount} of {summary.memberCount} {summary.memberCount === 1 ? "person is" : "people are"} sharing. Only
              shared data is included.
            </p>

            {summary.sharingCount === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                No one is sharing yet. Choose what you share above, and ask others to do the same.
              </p>
            ) : summary.mixedCurrencies ? (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                Members use different currencies, so there&apos;s no combined total. Each person&apos;s numbers are below.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Tile label="Combined income" value={money(summary.totals.income)} />
                <Tile label="Combined spending" value={money(summary.totals.spending)} />
                <Tile label="Left over" value={money(summary.totals.net)} />
              </div>
            )}

            {summary.perMember.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {summary.perMember.map((m) => {
                  const own = moneyIn(m.currency);
                  return (
                    <li key={String(m.userId)} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                      <span className="min-w-0 flex-1 basis-32 truncate font-medium text-slate-900 dark:text-white">{m.name}</span>
                      <span className="text-slate-500 dark:text-slate-400">In {own(m.income)}</span>
                      <span className="text-slate-500 dark:text-slate-400">Out {own(m.spending)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {summary.categories.length > 0 && (
            <section className={card}>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Spending by category</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">From members sharing everything.</p>
              <ul className="mt-3 flex flex-col gap-2">
                {summary.categories.map((c) => (
                  <li key={c.category}>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{formatCategory(c.category)}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{money(c.spent)}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.max((c.spent / summary.categories[0].spent) * 100, 2)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summary.recent.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent shared transactions</h2>
              <ul className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {summary.recent.map((t) => (
                  <li key={t._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium capitalize text-slate-900 dark:text-white">{t.description || t.category}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {t.memberName} · {formatCategory(t.category)} · {formatDate(t.date)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${t.transactionType === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                      {t.transactionType === "income" ? "+" : "-"}
                      {moneyIn(t.currency)(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">People</h2>
              {household.isOwner && !renaming && (
                <button
                  onClick={() => {
                    setRenameText(household.name);
                    setRenaming(true);
                  }}
                  className={secondaryButton}
                >
                  <Pencil className="h-3.5 w-3.5" /> Rename household
                </button>
              )}
            </div>

            {renaming && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await run(() => renameHousehold(renameText))) setRenaming(false);
                }}
                className="mt-3 flex flex-wrap gap-2"
              >
                <input
                  id="household-rename"
                  aria-label="New household name"
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  maxLength={60}
                  className={`${fieldClass} min-w-0 flex-1 basis-48`}
                />
                <button type="submit" disabled={busy} className={primaryButton}>
                  <Check className="h-4 w-4" /> Save
                </button>
                <button type="button" onClick={() => setRenaming(false)} className={secondaryButton}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </form>
            )}

            <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {household.members.map((m) => (
                <li key={String(m.userId)} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white">
                      {m.name} {m.isMe && <span className="text-xs font-normal text-slate-400">(you)</span>}
                      {m.role === "owner" && <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="Owner" />}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {SHARE_LABEL[m.shareLevel]}
                      {m.email && ` · ${m.email}`}
                    </p>
                  </div>
                  {household.isOwner && !m.isMe && (
                    <button onClick={() => setConfirm({ type: "remove", member: m })} className={secondaryButton}>
                      <UserMinus className="h-3.5 w-3.5" /> Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {household.isOwner && (
              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (await run(() => inviteToHousehold(inviteEmail))) setInviteEmail("");
                  }}
                  className="flex flex-wrap gap-2"
                >
                  <input
                    id="invite-email"
                    type="email"
                    aria-label="Email to invite"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="Their email address"
                    className={`${fieldClass} min-w-0 flex-1 basis-48`}
                  />
                  <button type="submit" disabled={busy} className={primaryButton}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send invitation
                  </button>
                </form>

                {household.pendingInvites.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-2">
                    {household.pendingInvites.map((invite) => (
                      <li key={invite._id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">
                          {invite.email} <span className="text-xs text-slate-400">· invited, expires {formatDate(invite.expiresAt)}</span>
                        </span>
                        <button onClick={() => run(() => cancelHouseholdInvite(invite._id))} disabled={busy} className={secondaryButton}>
                          Cancel invite
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button onClick={() => setConfirm({ type: "leave" })} className={secondaryButton}>
                <LogOut className="h-3.5 w-3.5" /> Leave household
              </button>
              {household.isOwner && (
                <button onClick={() => setConfirm({ type: "delete" })} className={`${secondaryButton} text-red-600 dark:text-red-400`}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete household
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (await run(confirmCopy.action)) setConfirm(null);
        }}
        loading={busy}
        loadingLabel="Saving..."
        title={confirmCopy?.title}
        description={confirmCopy?.description}
        confirmLabel={confirmCopy?.label}
      />
    </div>
  );
};

export default HouseholdPage;
