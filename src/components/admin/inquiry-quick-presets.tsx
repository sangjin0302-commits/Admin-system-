import Link from "next/link";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  AdminSort,
  InquiryStatus,
  InquiryStatusGroup,
  InquiryType,
  LanguageCode,
  UrgencyLevel
} from "@/types/inquiry";

export type InquiryViewMode = "list" | "board";

type InquiryQuickPresetsProps = {
  viewMode: InquiryViewMode;
  filters: {
    status?: InquiryStatus;
    statusGroup?: InquiryStatusGroup;
    urgency?: UrgencyLevel;
    inquiryType?: InquiryType;
    retained?: "all" | "won" | "active";
    language?: LanguageCode;
    sort?: AdminSort;
  };
};

type Preset = {
  key: string;
  label: string;
  description: string;
  params: Record<string, string>;
  isActive: (filters: InquiryQuickPresetsProps["filters"]) => boolean;
};

const presets: Preset[] = [
  {
    key: "urgent",
    label: "긴급 우선",
    description: "긴급 건만 빠르게 확인",
    params: { urgency: "CRITICAL", sort: "urgency", retained: "active" },
    isActive: (filters) => filters.urgency === "CRITICAL"
  },
  {
    key: "consultation",
    label: "상담 연결",
    description: "상담 필요/대기 건 확인",
    params: { statusGroup: "CONSULTATION", retained: "active", sort: "latest" },
    isActive: (filters) => filters.statusGroup === "CONSULTATION"
  },
  {
    key: "quote",
    label: "견적 후속",
    description: "견적 작성/발송 흐름",
    params: { statusGroup: "QUOTE", retained: "active", sort: "latest" },
    isActive: (filters) => filters.statusGroup === "QUOTE"
  },
  {
    key: "review",
    label: "검토·보류",
    description: "장기 검토/보류 병목 확인",
    params: { statusGroup: "REVIEW", retained: "active", sort: "latest" },
    isActive: (filters) => filters.statusGroup === "REVIEW"
  },
  {
    key: "visa",
    label: "비자·체류",
    description: "비자/출입국 문의만 보기",
    params: { inquiryType: "FOREIGNER_VISA", retained: "all", sort: "latest" },
    isActive: (filters) => filters.inquiryType === "FOREIGNER_VISA"
  },
  {
    key: "english",
    label: "영문 문의",
    description: "영어 상담 채널 점검",
    params: { language: "EN", retained: "active", sort: "latest" },
    isActive: (filters) => filters.language === "EN"
  },
  {
    key: "won",
    label: "수임 완료",
    description: "수임 전환된 건 확인",
    params: { retained: "won", sort: "latest" },
    isActive: (filters) => filters.retained === "won"
  }
];

function toPresetHref(mode: InquiryViewMode, params: Record<string, string>) {
  const query = new URLSearchParams({ ...params, view: mode });
  return `/admin/inquiries?${query.toString()}`;
}

export function InquiryQuickPresets({ viewMode, filters }: InquiryQuickPresetsProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="ui-kicker">Quick Presets</p>
          <h3 className="mt-1 text-lg font-semibold text-text-strong">바로 쓰는 필터</h3>
        </div>
        <p className="text-sm text-text-muted">업무 패턴별로 자주 쓰는 필터를 한 번에 적용합니다.</p>
      </div>

      <div className="mt-4 grid gap-2 xl:grid-cols-3">
        {presets.map((preset) => {
          const active = preset.isActive(filters);
          return (
            <Link
              key={preset.key}
              href={toPresetHref(viewMode, preset.params)}
              className={cn(
                "rounded-xl border px-4 py-3 transition",
                active
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line bg-surface text-text-strong hover:border-line-strong hover:bg-surface-muted"
              )}
            >
              <p className="text-sm font-semibold">{preset.label}</p>
              <p className={cn("mt-1 text-xs", active ? "text-primary" : "text-text-muted")}>{preset.description}</p>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
