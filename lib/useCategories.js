"use client";

import { useCallback, useEffect, useState } from "react";
import { getCategories } from "@/services/categoryService";

// Used until the server answers, so dropdowns are never empty
const BUILT_IN = {
  expense: ["food", "groceries", "entertainment", "transportation", "bills", "subscriptions", "other"],
  income: ["salary", "freelance", "investment", "gift", "other"],
};

// "other" stays last, with the user's own categories before it
const withCustom = (builtIn, customNames) => {
  const rest = builtIn.filter((name) => name !== "other");
  return [...rest, ...customNames, ...(builtIn.includes("other") ? ["other"] : [])];
};

export const formatCategory = (value = "") => value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// The built-in categories plus this user's own, ready for dropdowns
export const useCategories = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setData(await getCategories());
    } catch {
      // the built-in list still works, so this isn't worth an error message
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const custom = data?.custom || [];
  const builtIn = data?.builtIn || BUILT_IN;
  const namesFor = (kind) => custom.filter((c) => c.kind === kind || c.kind === "both").map((c) => c.name);

  const expense = withCustom(builtIn.expense, namesFor("expense"));
  const income = withCustom(builtIn.income, namesFor("income"));

  return {
    expense,
    income,
    all: [...new Set([...expense, ...income])],
    builtIn,
    custom,
    rules: data?.rules || [],
    loading,
    reload,
  };
};
