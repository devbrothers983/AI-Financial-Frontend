"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useTheme } from "next-themes";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";

import { googleLogin } from "@/services/authService";
import { loginSuccess } from "@/slices/authSlice";

const GoogleAuthButton = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSuccess = async (credentialResponse) => {
    try {
      const response = await googleLogin(credentialResponse.credential);

      dispatch(
        loginSuccess({
          user: { username: response.username, email: response.email, role: response.role },
          token: response.token,
        })
      );

      toast.success("Signed in with Google");
      router.push("/dashboard");
    } catch (err) {
      const message = err.response?.data?.message || "Google sign-in failed. Please try again.";
      toast.error(message);
    }
  };

  if (!mounted) {
    return <div className="mx-auto h-10 w-[336px] max-w-full" aria-hidden="true" />;
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error("Google sign-in failed. Please try again.")}
        theme={resolvedTheme === "dark" ? "filled_black" : "outline"}
        size="large"
        shape="pill"
        width="336"
      />
    </div>
  );
};

export default GoogleAuthButton;
