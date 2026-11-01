"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Search, ShieldCheck, Shield, UserX, UserCheck, Trash2, Eye, Download, Loader2, Users as UsersIcon } from "lucide-react";

import { getAllUsers, updateUserRole, updateUserStatus, deleteUser } from "@/services/adminService";
import { downloadFromApi } from "@/lib/download";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/Skeleton";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never";

const selectClass =
  "cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:ring-indigo-500/20";

const RoleBadge = ({ role }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
      role === "admin"
        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
    }`}
  >
    {role}
  </span>
);

const StatusBadge = ({ isActive }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
      isActive
        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
        : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
    }`}
  >
    {isActive ? "Active" : "Deactivated"}
  </span>
);

// Icon-only buttons in the desktop table, labeled buttons in the mobile cards.
const UserActions = ({ user, isSelf, labeled, onRoleToggle, onStatus, onDelete }) => {
  const base = labeled
    ? "flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium dark:border-slate-700"
    : "rounded-lg p-1.5";

  return (
    <div className={labeled ? "grid grid-cols-2 gap-2" : "flex items-center justify-end gap-1"}>
      <Link
        href={`/dashboard/users/${user._id}`}
        title="View details"
        className={`${base} text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white`}
      >
        <Eye className="h-4 w-4" />
        {labeled && "View"}
      </Link>
      <button
        onClick={() => onRoleToggle(user)}
        disabled={isSelf}
        title={user.role === "admin" ? "Demote to user" : "Promote to admin"}
        className={`${base} cursor-pointer text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400`}
      >
        {user.role === "admin" ? <Shield className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
        {labeled && (user.role === "admin" ? "Make user" : "Make admin")}
      </button>
      <button
        onClick={() => onStatus(user)}
        disabled={isSelf}
        title={user.isActive ? "Deactivate" : "Reactivate"}
        className={`${base} cursor-pointer text-slate-500 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-amber-500/10 dark:hover:text-amber-400`}
      >
        {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        {labeled && (user.isActive ? "Deactivate" : "Reactivate")}
      </button>
      <button
        onClick={() => onDelete(user)}
        disabled={isSelf}
        title="Delete user"
        className={`${base} cursor-pointer text-red-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-500/10`}
      >
        <Trash2 className="h-4 w-4" />
        {labeled && "Delete"}
      </button>
    </div>
  );
};

const UsersPage = () => {
  const { user: currentUser } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await getAllUsers(params);
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const handleRoleToggle = async (targetUser) => {
    const nextRole = targetUser.role === "admin" ? "user" : "admin";
    try {
      await updateUserRole(targetUser._id, nextRole);
      toast.success(`${targetUser.username} is now ${nextRole === "admin" ? "an admin" : "a regular user"}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleStatusConfirm = async () => {
    try {
      setActionLoading(true);
      const nextActive = !statusTarget.isActive;
      await updateUserStatus(statusTarget._id, nextActive);
      toast.success(`${statusTarget.username} ${nextActive ? "reactivated" : "deactivated"}`);
      setStatusTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setActionLoading(true);
      await deleteUser(deleteTarget._id);
      toast.success(`${deleteTarget.username} deleted`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  // exports every user matching the current filters, not just this page
  const handleExport = async () => {
    try {
      setExporting(true);
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      await downloadFromApi("/admin/users/export", params, "users.csv");
    } catch {
      toast.error("Failed to export users");
    } finally {
      setExporting(false);
    }
  };

  const actionHandlers = {
    onRoleToggle: handleRoleToggle,
    onStatus: setStatusTarget,
    onDelete: setDeleteTarget,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Search, manage roles, and control account access across the platform.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export CSV
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative w-full flex-1 sm:min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or email..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-500/20"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={selectClass}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <UsersIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">No users match these filters.</p>
          </div>
        ) : (
          <>
            {/* Mobile: one card per user */}
            <div className="flex flex-col gap-3 md:hidden">
              {users.map((u) => {
                const isSelf = u.email === currentUser?.email;
                return (
                  <div
                    key={u._id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-white">
                          {u.username} {isSelf && <span className="text-xs text-slate-400">(you)</span>}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <RoleBadge role={u.role} />
                        <StatusBadge isActive={u.isActive} />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Joined {formatDate(u.createdAt)}</span>
                      <span>Last login {formatDate(u.lastLoginAt)}</span>
                    </div>
                    <div className="mt-3">
                      <UserActions user={u} isSelf={isSelf} labeled {...actionHandlers} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Last login</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => {
                    const isSelf = u.email === currentUser?.email;
                    return (
                      <tr key={u._id}>
                        <td className="px-4 py-3">
                          <Link href={`/dashboard/users/${u._id}`} className="group">
                            <p className="font-medium text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                              {u.username} {isSelf && <span className="text-xs text-slate-400">(you)</span>}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge isActive={u.isActive} />
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(u.lastLoginAt)}</td>
                        <td className="px-4 py-3">
                          <UserActions user={u} isSelf={isSelf} {...actionHandlers} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages} — {pagination.totalUsers} users
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={pagination.currentPage <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm}
        loading={actionLoading}
        loadingLabel="Saving..."
        title={statusTarget?.isActive ? "Deactivate user?" : "Reactivate user?"}
        description={
          statusTarget?.isActive
            ? `${statusTarget?.username} will be immediately signed out and won't be able to log back in until reactivated.`
            : `${statusTarget?.username} will be able to log in again.`
        }
        confirmLabel={statusTarget?.isActive ? "Deactivate" : "Reactivate"}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading}
        title="Delete user?"
        description={`This will permanently delete ${deleteTarget?.username} and all of their transactions, budgets, and goals. This cannot be undone.`}
      />
    </div>
  );
};

export default UsersPage;
