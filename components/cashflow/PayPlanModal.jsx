"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Sparkles } from "lucide-react";

import Modal from "@/components/ui/Modal";
import { getPayPlan, updatePayPlan, announceCashflowChange } from "@/services/cashflowService";
import { money, longDate, toDateInput, PAY_FREQUENCY_LABEL } from "./format";

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-500/20";
const labelClass = "text-xs font-medium text-slate-500 dark:text-slate-400";
const checkClass =
  "flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300";

// Balance and payday: the two things "safe to spend" needs from the user
const PayPlanModal = ({ open, onClose, onSaved, currency = "USD" }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({
    balance: "",
    paydayMode: "auto",
    frequency: "monthly",
    nextPayday: "",
    useBankBalance: true,
    includeGoals: true,
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const { plan: loaded } = await getPayPlan();
        if (cancelled) return;
        setPlan(loaded);
        setForm({
          balance: loaded.balance ?? "",
          paydayMode: loaded.frequency ? "manual" : "auto",
          frequency: loaded.frequency || loaded.detected?.frequency || "monthly",
          nextPayday: toDateInput(loaded.nextPayday || loaded.detected?.nextPayday),
          useBankBalance: loaded.useBankBalance,
          includeGoals: loaded.includeGoals,
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Couldn't load your settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const setField = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      useBankBalance: form.useBankBalance,
      includeGoals: form.includeGoals,
    };

    // only send the balance when it changed, so its "entered on" date stays right
    const typed = form.balance === "" ? null : Number(form.balance);
    if (typed !== (plan?.balance ?? null)) payload.balance = typed;

    if (form.paydayMode === "manual") {
      if (!form.nextPayday) {
        toast.warning("Enter your next payday");
        return;
      }
      payload.frequency = form.frequency;
      payload.nextPayday = form.nextPayday;
    } else if (plan?.frequency) {
      // back to finding payday automatically
      payload.frequency = null;
      payload.nextPayday = null;
    }

    try {
      setSaving(true);
      await updatePayPlan(payload);
      toast.success("Saved");
      announceCashflowChange();
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save your settings");
    } finally {
      setSaving(false);
    }
  };

  const detected = plan?.detected;

  return (
    <Modal open={open} onClose={onClose} title="Pay & balance">
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1">
          <div>
            <label className={labelClass}>
              Money in your spending account right now
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={form.balance}
                onChange={setField("balance")}
                placeholder="e.g. 1925.00"
                className={fieldClass}
              />
            </label>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Your checking account, not savings. Anything you add in Transactions after today is taken into account, so you
              only need to update this now and then.
              {plan?.balanceSetAt && ` Last entered ${longDate(plan.balanceSetAt)}.`}
            </p>
          </div>

          <label className={checkClass}>
            <input type="checkbox" checked={form.useBankBalance} onChange={setField("useBankBalance")} className="mt-0.5 h-4 w-4 cursor-pointer accent-emerald-600" />
            <span>
              Use my connected bank&apos;s balance when I have one
              <span className="block text-xs text-slate-500 dark:text-slate-400">It updates by itself, so it&apos;s more accurate than a typed balance.</span>
            </span>
          </label>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">When do you get paid?</p>

            <div className="mt-2 flex flex-col gap-2">
              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="paydayMode"
                  value="auto"
                  checked={form.paydayMode === "auto"}
                  onChange={setField("paydayMode")}
                  className="mt-1 cursor-pointer accent-emerald-600"
                />
                <span>
                  Find it from my income
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {detected ? (
                      <>
                        <Sparkles className="mr-1 inline h-3 w-3 text-emerald-500" />
                        Found: {PAY_FREQUENCY_LABEL[detected.frequency].toLowerCase()}, about {money(detected.amount, currency)}. Next
                        one {longDate(detected.nextPayday)}.
                      </>
                    ) : (
                      "We couldn't find a regular pay pattern yet, so the month's end is used until you set it."
                    )}
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="paydayMode"
                  value="manual"
                  checked={form.paydayMode === "manual"}
                  onChange={setField("paydayMode")}
                  className="mt-1 cursor-pointer accent-emerald-600"
                />
                <span>I&apos;ll set it myself</span>
              </label>
            </div>

            {form.paydayMode === "manual" && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  I&apos;m paid
                  <select value={form.frequency} onChange={setField("frequency")} className={`${fieldClass} cursor-pointer`}>
                    {Object.entries(PAY_FREQUENCY_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Next payday
                  <input type="date" value={form.nextPayday} onChange={setField("nextPayday")} className={fieldClass} />
                </label>
              </div>
            )}
          </div>

          <label className={checkClass}>
            <input type="checkbox" checked={form.includeGoals} onChange={setField("includeGoals")} className="mt-0.5 h-4 w-4 cursor-pointer accent-emerald-600" />
            <span>
              Set aside money for my goals first
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Each goal&apos;s monthly savings is kept out of the safe-to-spend amount.
              </span>
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default PayPlanModal;
