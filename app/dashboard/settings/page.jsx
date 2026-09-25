"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { User, Mail, Camera, Trash2, Loader2, ArrowRight } from "lucide-react";

import { getProfile, updateProfile, changePassword, uploadAvatar, deleteAvatar } from "@/services/userService";
import { updateUser } from "@/slices/authSlice";

import FormInput from "@/components/auth/FormInput";
import PasswordInput from "@/components/auth/PasswordInput";
import Skeleton from "@/components/Skeleton";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

const SettingsPage = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [profileForm, setProfileForm] = useState({ username: "", email: "" });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await getProfile();
        setProfile(response.user);
        setProfileForm({ username: response.user.username, email: response.user.email });
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    try {
      setAvatarUploading(true);
      const response = await uploadAvatar(file);
      setProfile((prev) => ({ ...prev, avatarUrl: response.avatarUrl }));
      dispatch(updateUser({ avatarUrl: response.avatarUrl }));
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setAvatarUploading(true);
      await deleteAvatar();
      setProfile((prev) => ({ ...prev, avatarUrl: null }));
      dispatch(updateUser({ avatarUrl: null }));
      toast.success("Profile photo removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove photo");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setProfileErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validateProfile = () => {
    const errors = {};
    if (!profileForm.username.trim()) errors.username = "Username is required";
    if (!profileForm.email) errors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(profileForm.email)) errors.email = "Enter a valid email";
    return errors;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    const errors = validateProfile();
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      toast.warning("Please fix the errors below");
      return;
    }

    try {
      setSavingProfile(true);
      const response = await updateProfile(profileForm);
      setProfile(response.user);
      dispatch(updateUser({ username: response.user.username, email: response.user.email }));
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validatePassword = () => {
    const errors = {};
    if (profile?.hasPassword && !passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    if (!passwordForm.newPassword) errors.newPassword = "New password is required";
    else if (passwordForm.newPassword.length < 8) errors.newPassword = "Must be at least 8 characters";
    if (!passwordForm.confirmNewPassword) errors.confirmNewPassword = "Please confirm your new password";
    else if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      errors.confirmNewPassword = "Passwords do not match";
    }
    return errors;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      toast.warning("Please fix the errors below");
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword(passwordForm);
      toast.success(profile?.hasPassword ? "Password updated" : "Password set successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setProfile((prev) => ({ ...prev, hasPassword: true }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-8 flex flex-col gap-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account settings</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your profile, photo, and password.</p>

      <div className="mt-8 flex flex-col gap-6">
        {/* Profile photo */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Profile photo</h2>
          <div className="mt-4 flex items-center gap-5">
            <div className="relative">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-indigo-600 text-xl font-semibold text-white">
                  {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/50">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={handleAvatarClick}
                disabled={avatarUploading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                Change photo
              </button>
              {profile?.avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">JPG or PNG, up to 5MB.</p>
        </div>

        {/* Profile details */}
        <form
          onSubmit={handleProfileSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Profile details</h2>

          <FormInput
            icon={User}
            label="Username"
            name="username"
            value={profileForm.username}
            onChange={handleProfileChange}
            error={profileErrors.username}
          />

          <FormInput
            icon={Mail}
            label="Email address"
            type="email"
            name="email"
            value={profileForm.email}
            onChange={handleProfileChange}
            error={profileErrors.email}
          />

          <button
            type="submit"
            disabled={savingProfile}
            className="flex w-fit items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
          >
            {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
            {savingProfile ? "Saving..." : "Save changes"}
            {!savingProfile && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Password */}
        <form
          onSubmit={handlePasswordSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {profile?.hasPassword ? "Change password" : "Set a password"}
            </h2>
            {!profile?.hasPassword && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Your account signed in with Google. Set a password to also sign in with your email.
              </p>
            )}
          </div>

          {profile?.hasPassword && (
            <PasswordInput
              label="Current password"
              name="currentPassword"
              placeholder="Enter your current password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.currentPassword}
              autoComplete="current-password"
            />
          )}

          <PasswordInput
            label="New password"
            name="newPassword"
            placeholder="Enter a new password"
            value={passwordForm.newPassword}
            onChange={handlePasswordChange}
            error={passwordErrors.newPassword}
            autoComplete="new-password"
            showStrength
          />

          <PasswordInput
            label="Confirm new password"
            name="confirmNewPassword"
            placeholder="Re-enter your new password"
            value={passwordForm.confirmNewPassword}
            onChange={handlePasswordChange}
            error={passwordErrors.confirmNewPassword}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={savingPassword}
            className="flex w-fit items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
          >
            {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
            {savingPassword ? "Saving..." : profile?.hasPassword ? "Update password" : "Set password"}
            {!savingPassword && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
