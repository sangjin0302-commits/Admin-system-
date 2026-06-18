"use client";

import { useEffect } from "react";

export function LiveChat() {
  const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID;

  useEffect(() => {
    if (!widgetId) return;

    // Avoid duplicate injection
    if (document.getElementById("tawkto-script")) return;

    const script = document.createElement("script");
    script.id = "tawkto-script";
    script.async = true;
    script.src = `https://embed.tawk.to/${widgetId}/default`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById("tawkto-script");
      if (existing) existing.remove();
      // Clean up Tawk.to iframe/widget
      const tawkElements = document.querySelectorAll("[id^='tawk-']");
      tawkElements.forEach((el) => el.remove());
    };
  }, [widgetId]);

  if (!widgetId) return null;

  return null;
}
