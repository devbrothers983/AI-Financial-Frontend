"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Download, X } from "lucide-react";

const InstallPrompt = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const wasAuthenticated = useRef(isAuthenticated);

  const isStandalone = () =>
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      if (!isStandalone()) setVisible(true);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Show the prompt again every time the user logs in, even if it was
  // dismissed earlier — as long as the browser still has an install prompt
  // available and the app isn't already installed.
  useEffect(() => {
    const justLoggedIn = isAuthenticated && !wasAuthenticated.current;
    wasAuthenticated.current = isAuthenticated;

    if (justLoggedIn && deferredPrompt && !isStandalone()) {
      setVisible(true);
    }
  }, [isAuthenticated, deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 sm:inset-x-auto sm:right-4">
      <img src="/icons/icon-192.png" alt="AI Financial Coach" className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Install AI Financial Coach</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Add it to your home screen for quick, app-like access.</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-105 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Install
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
