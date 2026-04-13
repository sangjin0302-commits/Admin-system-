import { cn } from "@/lib/utils";
import { inquiryStatusLabels, urgencyLabels, type InquiryStatus, type UrgencyLevel } from "@/types/inquiry";

const statusStyles: Record<InquiryStatus, string> = {
  NEW: "bg-slate-100 text-slate-700",
  PRE_DIAGNOSED: "bg-indigo-100 text-indigo-700",
  CONSULTATION_REQUIRED: "bg-amber-100 text-amber-800",
  QUOTE_DRAFTED: "bg-violet-100 text-violet-700",
  QUOTE_PENDING: "bg-fuchsia-100 text-fuchsia-700",
  ON_HOLD: "bg-zinc-200 text-zinc-700",
  IN_REVIEW: "bg-blue-100 text-blue-700",
  WAITING_CONSULTATION: "bg-amber-100 text-amber-800",
  QUOTE_SENT: "bg-purple-100 text-purple-700",
  WON: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-stone-200 text-stone-700"
};

const urgencyStyles: Record<UrgencyLevel, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-sky-100 text-sky-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-rose-100 text-rose-700"
};

export function AdminStatusBadge({
  status,
  urgency
}: {
  status?: InquiryStatus;
  urgency?: UrgencyLevel;
}) {
  if (status) {
    return (
      <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusStyles[status])}>
        {inquiryStatusLabels[status].ko}
      </span>
    );
  }

  if (urgency) {
    return (
      <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", urgencyStyles[urgency])}>
        {urgencyLabels[urgency].ko}
      </span>
    );
  }

  return null;
}
