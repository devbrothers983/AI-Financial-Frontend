"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { usePlaidLink } from "react-plaid-link";
import { Landmark, Plus, RefreshCw, Loader2, Unplug, AlertTriangle, ShieldCheck, Lock } from "lucide-react";

import {
  getBankConnections,
  createLinkToken,
  exchangePublicToken,
  syncBankConnection,
  disconnectBank,
} from "@/services/bankService";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/Skeleton";

// Banks that sign in on their own site send the user back here, so the Link
// session has to survive the page reload.
const LINK_SESSION_KEY = "plaid-link-session";

const saveLinkSession = (session) => {
  try {
    localStorage.setItem(LINK_SESSION_KEY, JSON.stringify(session));
  } catch {
    // only affects returning from a bank's own sign-in page
  }
};

const readLinkSession = () => {
  try {
    return JSON.parse(localStorage.getItem(LINK_SESSION_KEY));
  } catch {
    return null;
  }
};

const clearLinkSession = () => {
  try {
    localStorage.removeItem(LINK_SESSION_KEY);
  } catch {
    // nothing to clear
  }
};

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : "Not yet";

const syncSummary = (synced) => {
  if (!synced) return "A sync is already running";
  if (!synced.added && !synced.modified && !synced.removed) return "Everything is up to date";
  const parts = [];
  if (synced.added) parts.push(`${synced.added} new`);
  if (synced.modified) parts.push(`${synced.modified} updated`);
  if (synced.removed) parts.push(`${synced.removed} removed`);
  return `Transactions: ${parts.join(", ")}`;
};

// Opens Plaid's window as soon as it's ready
const PlaidLinkLauncher = ({ token, receivedRedirectUri, onSuccess, onExit }) => {
  const { open, ready } = usePlaidLink({ token, receivedRedirectUri, onSuccess, onExit });

  useEffect(() => {
    if (ready) open();
  }, [ready, open]);

  return null;
};

const STATUS = {
  active: { label: "Connected", className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
  needs_reauth: { label: "Sign-in needed", className: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  revoked: { label: "Access removed", className: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" },
};

const BanksPage = () => {
  const [connections, setConnections] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  // { token, connectionId, receivedRedirectUri } while Plaid's window is in use
  const [link, setLink] = useState(null);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [syncingId, setSyncingId] = useState(null);

  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const [deleteImported, setDeleteImported] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchConnections = useCallback(async () => {
    try {
      const response = await getBankConnections();
      setConnections(response.connections);
      setEnabled(response.enabled);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load bank connections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // back from a bank's own sign-in page: continue the same Link session
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("oauth_state_id")) return;
    const session = readLinkSession();
    if (session?.token) setLink({ ...session, receivedRedirectUri: window.location.href });
  }, []);

  const endLinkSession = () => {
    clearLinkSession();
    setLink(null);
    if (window.location.search) window.history.replaceState(null, "", "/dashboard/banks");
  };

  const startLink = async (connectionId) => {
    try {
      setStarting(true);
      const response = await createLinkToken(connectionId);
      const session = { token: response.linkToken, connectionId: connectionId || null };
      saveLinkSession(session);
      setLink(session);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't start the bank connection");
    } finally {
      setStarting(false);
    }
  };

  const handleLinkSuccess = async (publicToken, metadata) => {
    const reconnectId = link?.connectionId;
    endLinkSession();
    try {
      setFinishing(true);
      if (reconnectId) {
        const response = await syncBankConnection(reconnectId);
        toast.success(`Bank reconnected. ${syncSummary(response.synced)}`);
      } else {
        const response = await exchangePublicToken(publicToken, metadata?.institution);
        toast.success(
          response.synced?.added
            ? `${response.message}. Imported ${response.synced.added} transactions.`
            : `${response.message}. Your transactions can take a few minutes to arrive.`
        );
      }
      fetchConnections();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't finish connecting your bank");
    } finally {
      setFinishing(false);
    }
  };

  const handleLinkExit = (error) => {
    endLinkSession();
    if (error) toast.error(error.display_message || "The bank connection didn't finish. Please try again.");
  };

  const handleSync = async (connection) => {
    try {
      setSyncingId(connection._id);
      const response = await syncBankConnection(connection._id);
      toast.success(syncSummary(response.synced));
      fetchConnections();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't sync with your bank");
      fetchConnections();
    } finally {
      setSyncingId(null);
    }
  };

  const closeDisconnect = () => {
    setDisconnectTarget(null);
    setDeleteImported(false);
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const response = await disconnectBank(disconnectTarget._id, deleteImported);
      toast.success(response.message);
      closeDisconnect();
      fetchConnections();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't disconnect this bank");
    } finally {
      setDisconnecting(false);
    }
  };

  const busy = starting || finishing || Boolean(link);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      {link && (
        <PlaidLinkLauncher
          token={link.token}
          receivedRedirectUri={link.receivedRedirectUri}
          onSuccess={handleLinkSuccess}
          onExit={handleLinkExit}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 text-white">
            <Landmark className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Connected banks</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Import your bank transactions automatically.
            </p>
          </div>
        </div>
        {enabled && connections.length > 0 && (
          <button
            onClick={() => startLink()}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Connect another bank
          </button>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : !enabled ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <Landmark className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Bank connections aren&apos;t available yet.</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <Landmark className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 font-medium text-slate-800 dark:text-slate-200">No banks connected yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Connect a US bank to bring in your transactions and keep your budgets and reports up to date.
            </p>
            <button
              onClick={() => startLink()}
              disabled={busy}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Connect a bank
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {connections.map((c) => {
              const status = STATUS[c.status] || STATUS.active;
              const syncing = syncingId === c._id;
              return (
                <li key={c._id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white">{c.institutionName}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Last updated: {formatDateTime(c.lastSyncedAt)}</p>
                      {c.status === "active" && c.lastErrorCode && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3 shrink-0" /> The last update had a problem. We&apos;ll try again automatically.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.status === "active" ? (
                        <button
                          onClick={() => handleSync(c)}
                          disabled={syncing}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} /> Sync now
                        </button>
                      ) : (
                        <button
                          onClick={() => startLink(c._id)}
                          disabled={busy}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60 cursor-pointer"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> Reconnect
                        </button>
                      )}
                      <button
                        onClick={() => setDisconnectTarget(c)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-500/10 cursor-pointer"
                      >
                        <Unplug className="h-3.5 w-3.5" /> Disconnect
                      </button>
                    </div>
                  </div>

                  {c.accounts?.length > 0 && (
                    <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                      {c.accounts.map((a) => (
                        <li key={a.accountId} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <span className="truncate text-slate-700 dark:text-slate-300">{a.name}</span>
                          <span className="shrink-0 text-xs capitalize text-slate-400 dark:text-slate-500">
                            {a.subtype || a.type}
                            {a.mask && ` ••${a.mask}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {enabled && !loading && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <Lock className="h-4 w-4 shrink-0 text-emerald-500" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You sign in to your bank through Plaid. We never see or store your bank password, and we can only read your
              transactions. We can&apos;t move money.
            </p>
          </div>
          <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transfers between your own accounts and credit card payments aren&apos;t imported, so the same money isn&apos;t counted
              twice. Review imports on the{" "}
              <Link href="/dashboard/transactions" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
                Transactions
              </Link>{" "}
              page.
            </p>
          </div>
        </div>
      )}

      <Modal open={Boolean(disconnectTarget)} onClose={closeDisconnect} title={`Disconnect ${disconnectTarget?.institutionName || "bank"}?`}>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          New transactions will stop importing and our access to this bank will end.
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={deleteImported}
            onChange={(e) => setDeleteImported(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-red-600"
          />
          <span>
            Also delete transactions imported from this bank
            <span className="block text-xs text-slate-400 dark:text-slate-500">
              Leave this unticked to keep them in your history. Deleting can&apos;t be undone.
            </span>
          </span>
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={closeDisconnect}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
          >
            {disconnecting && <Loader2 className="h-4 w-4 animate-spin" />}
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default BanksPage;
