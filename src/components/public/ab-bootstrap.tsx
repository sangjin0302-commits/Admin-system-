"use client";

import { useEffect } from "react";
import { AB_COOKIE_NAME } from "@/lib/ab";

function hasCookie(name: string): boolean {
  if (typeof document === "undefined") return false;
  return new RegExp("(?:^|; )" + name + "=").test(document.cookie);
}

export function AbBootstrap() {
  useEffect(() => {
    if (hasCookie(AB_COOKIE_NAME)) return;
    fetch("/api/public/ab-assign", { credentials: "same-origin" }).catch(() => {
      // silent; assignment is best-effort
    });
  }, []);
  return null;
}
