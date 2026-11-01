"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector } from "react-redux";

import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
import ViewAsBanner from "@/components/dashboard/ViewAsBanner";

const ADMIN_ONLY_PREFIXES = [
  "/dashboard/users",
  "/dashboard/user-activity",
  "/dashboard/security",
  "/dashboard/logs",
  "/dashboard/messages",
  "/dashboard/announcements",
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hydrated } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    const isAdminOnlyRoute = ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (isAdminOnlyRoute && user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [hydrated, isAuthenticated, user, pathname, router]);

  return (
    // h-dvh (not h-screen) so mobile browser toolbars don't hide the bottom of the page
    <div className="flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <ViewAsBanner />
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {hydrated && isAuthenticated && <AnnouncementBanner />}
          {children}
        </main>
      </div>
    </div>
  );
}
