import type { HTMLAttributes, PropsWithChildren } from "react";

import {
  languageToneMap,
  statusToneMap,
  urgencyToneMap
} from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";
import type { InquiryStatus, LanguageCode, UrgencyLevel } from "@/types/inquiry";

type BadgeProps = PropsWithChildren<
  HTMLAttributes<HTMLSpanElement> & {
    tone?: "default" | "status" | "urgency" | "language";
    status?: InquiryStatus;
    urgency?: UrgencyLevel;
    language?: LanguageCode;
  }
>;

export function Badge({
  className,
  children,
  tone = "default",
  status,
  urgency,
  language,
  ...props
}: BadgeProps) {
  const toneClass =
    tone === "status" && status
      ? statusToneMap[status]
      : tone === "urgency" && urgency
        ? urgencyToneMap[urgency]
        : tone === "language" && language
          ? languageToneMap[language]
          : "bg-surface-muted text-text border-line";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        toneClass,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
