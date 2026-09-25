"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  Sparkles,
  BarChart3,
  Settings,
  Headphones,
  MessageSquare,
  Users,
  Activity,
  Database,
  Shield,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import Logo from "./Logo";
import Skeleton from "./Skeleton";
import { logout } from "@/slices/authSlice";

const USER_GROUPS = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
      { href: "/dashboard/budgets", label: "Budgets", icon: PieChart },
      { href: "/dashboard/goals", label: "Goals", icon: Target },
      { href: "/dashboard/coach", label: "AI Coach", icon: Sparkles },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/contact", label: "Help & Support", icon: Headphones },
      { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquare },
    ],
  },
];

const ADMIN_GROUPS = [
  {
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "User Management",
    items: [
      { href: "/dashboard/users", label: "Users", icon: Users },
      { href: "/dashboard/user-activity", label: "User Activity", icon: Activity },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Financial Data",
    items: [
      { href: "/dashboard/transactions", label: "Transactions", icon: Database },
      { href: "/dashboard/budgets", label: "Budgets", icon: PieChart },
      { href: "/dashboard/goals", label: "Goals", icon: Target },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/security", label: "Security", icon: Shield },
      { href: "/dashboard/logs", label: "Logs", icon: FileText },
    ],
  },
  {
    label: "Feedback",
    items: [{ href: "/dashboard/messages", label: "Messages", icon: MessageSquare }],
  },
];

const NavLink = ({ item, active, collapsed, accentIconClass, onNavigate }) => {
  if (item.comingSoon) {
    return (
      <div
        title={collapsed ? `${item.label} (Soon)` : undefined}
        className={`flex cursor-not-allowed items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <span className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && item.label}
        </span>
        {!collapsed && (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            Soon
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        collapsed ? "justify-center" : "gap-3"
      } ${active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
    >
      <item.icon className={`h-4 w-4 shrink-0 ${active ? accentIconClass : ""}`} />
      {!collapsed && item.label}
    </Link>
  );
};

const SidebarContent = ({ collapsed, onToggleCollapsed, onNavigate }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, hydrated } = useSelector((state) => state.auth);

  const isAdmin = user?.role === "admin";
  const groups = isAdmin ? ADMIN_GROUPS : USER_GROUPS;
  const accentIconClass = isAdmin ? "text-indigo-400" : "text-emerald-400";

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col bg-slate-900">
      <div className={`flex items-center gap-2 px-4 py-5 ${collapsed ? "justify-center" : "justify-between"}`}>
        <div className={collapsed ? "" : "min-w-0"}>
          <Logo variant="light" compact={collapsed} />
          {!collapsed && (
            <p className="mt-0.5 truncate pl-11 text-xs text-slate-400">
              {isAdmin ? "Admin Portal" : "Your AI Financial Coach"}
            </p>
          )}
        </div>

        {onToggleCollapsed && (
          <button
            onClick={onToggleCollapsed}
            className="hidden shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}

        {onNavigate && (
          <button
            onClick={onNavigate}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 cursor-pointer lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {!hydrated ? (
        <div className="flex flex-col gap-2 px-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} dark className="h-9 w-full" />
          ))}
        </div>
      ) : (
        <>
          <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-2">
            {groups.map((group, idx) => (
              <div key={group.label || idx}>
                {group.label && !collapsed && (
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {group.label}
                  </p>
                )}
                {group.label && collapsed && <div className="mb-2 h-px bg-white/10" />}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.label}
                      item={item}
                      active={item.href && pathname === item.href}
                      collapsed={collapsed}
                      accentIconClass={accentIconClass}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-3">
            <Link
              href="/dashboard/settings"
              onClick={onNavigate}
              className={`flex items-center rounded-lg p-2 transition-colors hover:bg-white/5 ${
                collapsed ? "justify-center" : "gap-3"
              }`}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${
                    isAdmin ? "bg-indigo-500" : "bg-emerald-500"
                  }`}
                >
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{user?.username || "User"}</p>
                    <p className="truncate text-xs text-slate-400">{isAdmin ? "Administrator" : "User"}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                </>
              )}
            </Link>
            <button
              onClick={handleLogout}
              title={collapsed ? "Logout" : undefined}
              className={`mt-1 flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer ${
                collapsed ? "justify-center" : "gap-3"
              }`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && "Logout"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden shrink-0 overflow-hidden border-r border-white/10 lg:block"
      >
        <SidebarContent collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </motion.aside>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute left-0 top-0 h-full w-72 shadow-xl"
            >
              <SidebarContent collapsed={false} onNavigate={onClose} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
