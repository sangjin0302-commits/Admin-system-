"use client";

import { useEffect } from "react";
import { logger } from "@/lib/utils/logger";

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => {
        logger.warn("[pwa] service worker registration failed", err);
      });
  }, []);

  return null;
}
