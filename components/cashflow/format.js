// Formatting shared by the safe-to-spend card and the bills page

export const money = (value, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value || 0);
  } catch {
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  }
};

// Dates from the API are UTC midnights, so they're shown in UTC to keep the day right
export const shortDate = (value) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export const longDate = (value) =>
  new Date(value).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export const daysFromToday = (value) => {
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const date = new Date(value);
  return Math.round((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - today) / 86400000);
};

export const whenLabel = (value) => {
  const days = daysFromToday(value);
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} late`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
};

export const BILL_FREQUENCY_LABEL = {
  once: "One time",
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  monthly: "Every month",
  quarterly: "Every 3 months",
  yearly: "Every year",
};

export const PAY_FREQUENCY_LABEL = {
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  twice_monthly: "Twice a month (15th and last day)",
  monthly: "Once a month",
};
