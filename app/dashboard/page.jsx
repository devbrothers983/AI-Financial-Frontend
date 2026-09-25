"use client";

import React from "react";
import { useSelector } from "react-redux";

import UserOverview from "@/components/dashboard/UserOverview";
import AdminOverview from "@/components/dashboard/AdminOverview";

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);

  return user?.role === "admin" ? <AdminOverview /> : <UserOverview />;
};

export default DashboardPage;
