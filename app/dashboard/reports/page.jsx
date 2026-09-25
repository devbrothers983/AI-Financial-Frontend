"use client";

import React from "react";
import { useSelector } from "react-redux";

import UserReports from "@/components/reports/UserReports";
import AdminReports from "@/components/reports/AdminReports";

const ReportsPage = () => {
  const { user } = useSelector((state) => state.auth);

  return user?.role === "admin" ? <AdminReports /> : <UserReports />;
};

export default ReportsPage;
