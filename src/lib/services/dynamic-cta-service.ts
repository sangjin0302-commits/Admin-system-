/**
 * Dynamic CTA labels — 시간대·디바이스에 따라 CTA 문구를 동적으로 결정합니다.
 */

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface CtaContext {
  page: string;
  isMobile: boolean;
  timeOfDay: TimeOfDay;
}

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 22) return "evening";
  return "night";
}

const LABELS: Record<TimeOfDay, string> = {
  morning: "오늘 검토 시작하기",
  afternoon: "지금 문의하면 오늘 중 회신",
  evening: "접수하면 내일 오전 회신",
  night: "접수하면 내일 오전 회신",
};

const MOBILE_LABELS: Record<TimeOfDay, string> = {
  morning: "지금 문의하기",
  afternoon: "지금 문의하기",
  evening: "내일 회신 받기",
  night: "내일 회신 받기",
};

export function getCtaLabel(context: CtaContext): string {
  const { isMobile, timeOfDay } = context;
  if (isMobile) return MOBILE_LABELS[timeOfDay];
  return LABELS[timeOfDay];
}
