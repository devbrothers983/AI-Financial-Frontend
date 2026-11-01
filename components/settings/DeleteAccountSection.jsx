"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import { deleteMyAccount } from "@/services/userService";
import { logout } from "@/slices/authSlice";
import Modal from "@/components/ui/Modal";
import PasswordInput from "@/components/auth/PasswordInput";

// Settings "danger zone": permanently delete the account after confirming
const DeleteAccountSection = ({ hasPassword }) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canSubmit = hasPassword ? Boolean(password) : confirmation === "DELETE";

  const close = () => {
    setOpen(false);
    setPassword("");
    setConfirmation("");
    setError("");
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setDeleting(true);
      await deleteMyAccount(hasPassword ? { password } : { confirmation });
      dispatch(logout());
      toast.success("Your account has been deleted. Goodbye!");
      router.replace("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-500/30 dark:bg-slate-900">
      <h2 className="flex items-center gap-2 text-base font-semibold text-red-600 dark:text-red-400">
        <AlertTriangle className="h-4 w-4" /> Delete account
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Permanently delete your account along with all your transactions, budgets, goals, messages and notifications. This can&apos;t
        be undone.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 cursor-pointer"
      >
        <Trash2 className="h-4 w-4" /> Delete my account
      </button>

      <Modal open={open} onClose={close} title="Delete your account?">
        <form onSubmit={handleDelete} className="flex flex-col gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Everything in your account will be permanently deleted. You&apos;ll be signed out and won&apos;t be able to recover it.
          </p>

          {hasPassword ? (
            <PasswordInput
              label="Enter your password to confirm"
              name="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              error={error}
              autoComplete="current-password"
            />
          ) : (
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
              <input
                value={confirmation}
                onChange={(e) => {
                  setConfirmation(e.target.value);
                  setError("");
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-red-500/20"
              />
              {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
            </label>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || deleting}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {deleting ? "Deleting..." : "Delete forever"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DeleteAccountSection;
