"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Download, X } from "lucide-react";

import { getProfile, markAppInstalled } from "@/services/userService";
import { getViewAs } from "@/lib/viewAs";

// Remembered in this browser, and on the user's account once they're signed in,
// so the prompt doesn't come back in a browser tab, another browser, or another
// device they use.
const INSTALLED_KEY = "pwa-installed";

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);

const isInstalledHere = () => {
  if (isStandalone()) return true;
  try {
    return localStorage.getItem(INSTALLED_KEY) === "true";
  } catch {
    return false;
  }
};

const rememberHere = () => {
  try {
    localStorage.setItem(INSTALLED_KEY, "true");
  } catch {
    // storage unavailable (private mode): the account still remembers it
  }
};

// Chrome and Edge can report the install directly, where they support it
const browserReportsInstalled = async () => {
  try {
    const apps = await navigator.getInstalledRelatedApps?.();
    return Boolean(apps?.length);
  } catch {
    return false;
  }
};

const InstallPrompt = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const wasAuthenticated = useRef(isAuthenticated);
  const savedToAccount = useRef(false);
  const dismissed = useRef(false);

  const saveToAccount = () => {
    if (!localStorage.getItem("token") || getViewAs() || savedToAccount.current) return;
    savedToAccount.current = true;
    markAppInstalled().catch(() => {
      savedToAccount.current = false;
    });
  };

  const markInstalled = () => {
    rememberHere();
    saveToAccount();
    setVisible(false);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      if (!isInstalledHere()) setDeferredPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Installed before this was added, or remembered only in this browser:
  // copy it to the account as soon as the user is signed in
  useEffect(() => {
    if (!isAuthenticated) return;
    if (isStandalone()) rememberHere();
    if (isInstalledHere()) saveToAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Only shown after every check says it isn't installed. A dismissed prompt
  // comes back at the next login, but an installed app never brings it back.
  useEffect(() => {
    const justLoggedIn = isAuthenticated && !wasAuthenticated.current;
    wasAuthenticated.current = isAuthenticated;

    if (justLoggedIn) dismissed.current = false;
    if (!deferredPrompt || getViewAs() || dismissed.current || visible) return;

    let cancelled = false;

    const decide = async () => {
      if (isInstalledHere()) return;

      if (await browserReportsInstalled()) {
        if (!cancelled) markInstalled();
        return;
      }

      if (isAuthenticated) {
        try {
          const { user } = await getProfile();
          if (user?.appInstalled) {
            rememberHere();
            if (!cancelled) setDeferredPrompt(null);
            return;
          }
        } catch {
          // couldn't check, so don't risk showing it to someone who has it
          return;
        }
      }

      if (!cancelled) setVisible(true);
    };

    decide();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredPrompt, isAuthenticated]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") markInstalled();
    else {
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 sm:inset-x-auto sm:right-4">
      <div className="flex items-center gap-3">
        <img src="/icons/icon-192.png" alt="AI Financial Coach" className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Install AI Financial Coach</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Add it to your home screen for quick, app-like access.</p>
        </div>
        <button
          onClick={() => {
            dismissed.current = true;
            setVisible(false);
          }}
          aria-label="Dismiss"
          className="shrink-0 self-start rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={markInstalled}
          className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
        >
          I already installed it
        </button>
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:brightness-105 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Install
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
