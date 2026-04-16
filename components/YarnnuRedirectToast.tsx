"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "olovara:yarnnu-redirect-toast-shown:v1";

function isFromYarnnuReferrer(referrer: string): boolean {
  if (!referrer) return false;
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    return host === "yarnnu.com" || host.endsWith(".yarnnu.com");
  } catch {
    return referrer.toLowerCase().includes("yarnnu");
  }
}

function isFromYarnnuQuery(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    const from = (params.get("from") || "").toLowerCase();
    const utmSource = (params.get("utm_source") || "").toLowerCase();
    return from === "yarnnu" || utmSource === "yarnnu";
  } catch {
    return false;
  }
}

export function YarnnuRedirectToast() {
  useEffect(() => {
    try {
      const alreadyShown = window.localStorage.getItem(STORAGE_KEY);
      if (alreadyShown) return;

      const referrer = document.referrer;
      const fromYarnnu =
        isFromYarnnuReferrer(referrer) || isFromYarnnuQuery();
      if (!fromYarnnu) return;

      toast("Redirected from Yarnnu", {
        description:
          "You were sent here because Yarnnu is now OLOVARA. Welcome back!",
        duration: 8000,
      });

      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // If storage is blocked (privacy mode, etc), just do nothing.
    }
  }, []);

  return null;
}

