import { Bell, PieChart, Trophy, Megaphone, MessageSquare, ShieldAlert } from "lucide-react";

// Icon and colour for each notification, shared by the bell and the full page
export const TYPE_ICONS = {
  budget_alert: PieChart,
  goal_milestone: Trophy,
  announcement: Megaphone,
  message_reply: MessageSquare,
  security: ShieldAlert,
  system: Bell,
};

export const LEVEL_TONES = {
  info: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  danger: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
};

export const timeAgo = (value) => {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
