import type {
  InquiryStatus,
  LanguageCode,
  UrgencyLevel
} from "@/types/inquiry";

export const designTokens = {
  colors: {
    canvas: "243 245 247",
    surface: "255 255 255",
    surfaceMuted: "247 249 251",
    surfaceRaised: "255 255 255",
    line: "215 222 229",
    lineStrong: "196 206 216",
    textStrong: "23 33 43",
    text: "60 72 84",
    textMuted: "105 119 132",
    primary: "24 72 109",
    primarySoft: "232 239 245",
    success: "43 107 73",
    warning: "155 106 40",
    danger: "161 69 69"
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px"
  },
  shadow: {
    panel: "0 8px 24px rgba(15, 23, 31, 0.045)",
    floating: "0 16px 34px rgba(15, 23, 31, 0.08)"
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
