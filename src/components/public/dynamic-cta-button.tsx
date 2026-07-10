"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCtaLabel, getTimeOfDay } from "@/lib/services/dynamic-cta-service";

interface DynamicCtaButtonProps {
  /** Feature flag enabled externally */
  enabled?: boolean;
  className?: string;
}

export default function DynamicCtaButton({
  enabled = true,
  className,
}: DynamicCtaButtonProps) {
  const [label, setLabel] = useState("무료 검토 신청");

  useEffect(() => {
    if (!enabled) return;
    const isMobile = window.innerWidth < 768;
    const timeOfDay = getTimeOfDay();
    setLabel(getCtaLabel({ page: window.location.pathname, isMobile, timeOfDay }));
  }, [enabled]);

  return (
    <Link
      href="/intake"
      className={[
        "inline-flex items-center justify-center bg-primary text-white rounded-lg h-12 px-7 font-bold transition-colors hover:opacity-90",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </Link>
  );
}
