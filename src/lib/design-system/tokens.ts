import type {
  InquiryStatus,
  LanguageCode,
  UrgencyLevel
} from "@/types/inquiry";

export const designTokens = {
  colors: {
    canvas: "244 246 248",
    surface: "255 255 255",
    surfaceMuted: "247 249 251",
    surfaceRaised: "255 255 255",
    line: "218 224 230",
    lineStrong: "197 206 214",
    textStrong: "22 33 43",
    text: "58 71 82",
    textMuted: "103 118 130",
    primary: "24 72 109",
    primarySoft: "231 240 247",
    success: "40 112 76",
    warning: "161 104 36",
    danger: "166 63 63"
  },
  radius: {
    sm: "10px",
    md: "14px",
    lg: "18px",
    xl: "22px"
  },
  shadow: {
    panel: "0 10px 28px rgba(16, 24, 32, 0.06)",
    floating: "0 18px 40px rgba(16, 24, 32, 0.1)"
  }
} as const;

export const statusToneMap: Record<InquiryStatus, string> = {
  NEW: "bg-slate-100 text-slate-700 border-slate-200",
  PRE_DIAGNOSED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CONSULTATION_REQUIRED: "bg-amber-50 text-warning border-amber-200",
  QUOTE_DRAFTED: "bg-violet-50 text-violet-700 border-violet-200",
  QUOTE_PENDING: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  ON_HOLD: "bg-zinc-100 text-zinc-700 border-zinc-300",
  IN_REVIEW: "bg-primary-soft text-primary border-primary/15",
  WAITING_CONSULTATION: "bg-amber-50 text-warning border-amber-200",
  QUOTE_SENT: "bg-violet-50 text-violet-700 border-violet-200",
  WON: "bg-emerald-50 text-success border-emerald-200",
  CLOSED: "bg-slate-200 text-slate-700 border-slate-300"
};

export const urgencyToneMap: Record<UrgencyLevel, string> = {
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
  MEDIUM: "bg-sky-50 text-sky-700 border-sky-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  CRITICAL: "bg-rose-50 text-danger border-rose-200"
};

export const languageToneMap: Record<LanguageCode, string> = {
  KO: "bg-slate-100 text-slate-700 border-slate-200",
  EN: "bg-primary-soft text-primary border-primary/15",
  AR: "bg-stone-100 text-stone-700 border-stone-200"
};

export const buttonVariants = {
  primary:
    "border border-primary bg-primary text-white hover:bg-[#143d5d] hover:border-[#143d5d]",
  secondary:
    "border border-line-strong bg-surface text-text-strong hover:bg-surface-muted",
  subtle:
    "border border-transparent bg-surface-muted text-text-strong hover:bg-[#eef2f5]",
  ghost:
    "border border-transparent bg-transparent text-text hover:bg-surface-muted",
  danger:
    "border border-danger bg-danger text-white hover:bg-[#8f3535] hover:border-[#8f3535]"
} as const;

export const buttonSizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm"
} as const;
