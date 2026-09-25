"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";

import { forgotPassword, resetPassword } from "@/services/authService";

import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/auth/FormInput";
import PasswordInput from "@/components/auth/PasswordInput";
import AuthButton from "@/components/auth/AuthButton";

const OTP_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 30;

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const ForgotPasswordPage = () => {
  const router = useRouter();

  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const [formData, setFormData] = useState({ otp: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [resetting, setResetting] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(OTP_TTL_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { otp, password, confirmPassword } = formData;

  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, secondsLeft]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const sendCode = async () => {
    try {
      setSendingEmail(true);
      await forgotPassword(email);
      setStep("otp");
      setSecondsLeft(OTP_TTL_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success("If that email exists, a code has been sent.");
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setEmailError("Email is required");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setEmailError("Enter a valid email");
    await sendCode();
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || sendingEmail) return;
    await sendCode();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
  };

  const validateReset = () => {
    const errors = {};
    if (!otp || otp.length !== 6) errors.otp = "Enter the 6-digit code";
    if (!password) errors.password = "Password is required";
    else if (password.length < 8) errors.password = "Must be at least 8 characters";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    return errors;
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();

    if (secondsLeft === 0) {
      toast.error("This code has expired. Please request a new one.");
      return;
    }

    const errors = validateReset();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.warning("Please fix the errors below");
      return;
    }

    try {
      setResetting(true);
      await resetPassword({ email, otp, password, confirmPassword });
      toast.success("Password reset successful. Please sign in.");
      router.push("/login");
    } catch (err) {
      const message = err.response?.data?.message || "Reset failed. The code may be invalid or expired.";
      toast.error(message);
    } finally {
      setResetting(false);
    }
  };

  if (step === "otp") {
    return (
      <AuthLayout>
        <button
          onClick={() => setStep("email")}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Enter your code</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            We sent a 6-digit code to <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>.
          </p>
        </div>

        <form onSubmit={handleResetSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="otp" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Verification code
            </label>
            <input
              id="otp"
              name="otp"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) =>
                handleChange({ target: { name: "otp", value: e.target.value.replace(/\D/g, "") } })
              }
              placeholder="000000"
              className={`rounded-xl border bg-white px-3.5 py-3 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition-all dark:bg-slate-800 dark:text-white ${
                fieldErrors.otp
                  ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-500/20"
                  : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-500/20"
              }`}
            />
            {fieldErrors.otp && <p className="text-xs font-medium text-red-500">{fieldErrors.otp}</p>}

            <div className="mt-1 flex items-center justify-between text-xs">
              <span className={secondsLeft === 0 ? "font-medium text-red-500" : "text-slate-400 dark:text-slate-500"}>
                {secondsLeft === 0 ? "Code expired" : `Expires in ${formatTime(secondsLeft)}`}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || sendingEmail}
                className="font-semibold text-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-emerald-400 dark:hover:text-emerald-300 dark:disabled:text-slate-600 cursor-pointer"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>
          </div>

          <PasswordInput
            label="New password"
            name="password"
            placeholder="Enter a new password"
            value={password}
            onChange={handleChange}
            error={fieldErrors.password}
            autoComplete="new-password"
            showStrength
          />

          <PasswordInput
            label="Confirm password"
            name="confirmPassword"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
          />

          <AuthButton type="submit" loading={resetting} className="mt-2">
            {resetting ? "Resetting..." : "Reset password"}
            {!resetting && <ArrowRight className="h-4 w-4" />}
          </AuthButton>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Forgot your password?</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Enter your email and we&apos;ll send you a 6-digit code to reset it.
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4" noValidate>
        <FormInput
          icon={Mail}
          label="Email address"
          type="email"
          name="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError("");
          }}
          error={emailError}
          autoComplete="email"
        />

        <AuthButton type="submit" loading={sendingEmail} className="mt-2">
          {sendingEmail ? "Sending..." : "Send code"}
          {!sendingEmail && <ArrowRight className="h-4 w-4" />}
        </AuthButton>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Remembered your password?{" "}
        <a href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
          Sign in
        </a>
      </p>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
