"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import {
  getInquiryStatusLabel,
  getUrgencyLabel,
  normalizeInquiryStatus,
  normalizeUrgencyLevel,
  type InquiryStatus
} from "@/types/inquiry";

type InquiryBoardItem = {
  id: string;
  title: string;
  contactName: string;
  status: string;
  urgencyLevel: string;
  dueDate?: Date | null;
  nextContactAt?: Date | null;
  responsePending?: boolean;
  hasPreparedDocuments?: boolean;
  updatedAt: Date;
  publicTrackingCode?: string | null;
  email?: string | null;
};

function isDueSoon(date: Date | null | undefined): boolean {
  if (!date) return false;
  const now = new Date();
  const diff = new Date(date).getTime() - now.getTime();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  return diff >= 0 && diff <= threeDaysMs;
}

function getUrgencyBorderClass(urgency: string): string {
  switch (urgency) {
    case "HIGH":
    case "URGENT":
      return "border-l-4 border-l-red-500";
    case "MEDIUM":
      return "border-l-4 border-l-yellow-400";
    default:
      return "";
  }
}

type LaneConfig = {
  key: string;
  title: string;
  hint: string;
  statuses: InquiryStatus[];
};

const laneConfigs: LaneConfig[] = [
  {
    key: "triage",
    title: "초기 분류",
    hint: "신규 접수와 사전진단 흐름",
    statuses: ["NEW", "PRE_DIAGNOSED"]
  },
  {
    key: "consultation",
    title: "상담 연결",
    hint: "상담 필요 및 상담 대기 상태",
    statuses: ["CONSULTATION_REQUIRED", "WAITING_CONSULTATION"]
  },
  {
    key: "quote",
    title: "견적 진행",
    hint: "견적 초안, 대기, 발송 단계",
    statuses: ["QUOTE_DRAFTED", "QUOTE_PENDING", "QUOTE_SENT"]
  },
  {
    key: "review",
    title: "검토/보류",
    hint: "검토 보강 또는 보류 점검 건",
    statuses: ["IN_REVIEW", "ON_HOLD"]
  },
  {
    key: "won",
    title: "수임",
    hint: "수임 이후 사건 실행 단계",
    statuses: ["WON"]
  }
];

function belongsToLane(status: string, lane: LaneConfig) {
  const normalizedStatus = normalizeInquiryStatus(status);
  return lane.statuses.includes(normalizedStatus);
}

export function InquiryKanbanBoard({ inquiries }: { inquiries: InquiryBoardItem[] }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="ui-kicker">Pipeline Board</p>
          <h3 className="mt-2 ui-section-title">상태별 실행 보드</h3>
        </div>
        <p className="text-sm text-text-muted">
          GitHub 프로젝트 보드처럼 현재 상태를 칸으로 나눠서 병목 지점을 빠르게 확인합니다.
        </p>
      </div>

      <div className="mt-5 grid gap-4 2xl:grid-cols-5">
        {laneConfigs.map((lane) => {
          const laneItems = inquiries.filter((item) => belongsToLane(item.status, lane));

          return (
            <Card key={lane.key} muted className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-strong">{lane.title}</p>
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-text-strong">
                  {laneItems.length}
                </span>
              </div>
              <p className="mt-2 text-xs text-text-muted">{lane.hint}</p>

              <div className="mt-4 space-y-3">
                {laneItems.length > 0 ? (
                  laneItems.slice(0, 6).map((item) => {
                    const status = normalizeInquiryStatus(item.status);
                    const urgency = normalizeUrgencyLevel(item.urgencyLevel);

                    return (
                      <Link
                        key={item.id}
                        href={`/admin/inquiries/${item.id}`}
                        className={`group block rounded-xl border border-line bg-white px-3 py-3 transition hover:border-line-strong hover:bg-surface ${getUrgencyBorderClass(urgency)}`}
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone="urgency" urgency={urgency}>
                            {getUrgencyLabel(urgency)}
                          </Badge>
                          <Badge tone="status" status={status}>
                            {getInquiryStatusLabel(status)}
                          </Badge>
                        </div>
                        <p className="mt-2 truncate text-sm font-semibold text-text-strong">{item.title}</p>
                        <p className="mt-1 truncate text-xs text-text-muted">{item.contactName}</p>
                        <p className="mt-2 text-xs text-text">
                          기한 {formatDateTime(item.dueDate)}{isDueSoon(item.dueDate) && <span className="ml-1 text-red-500" title="마감 임박">🕐</span>} · 다음 연락 {formatDateTime(item.nextContactAt)}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          {item.responsePending ? "응답 대기" : "응답 흐름 안정"} ·{" "}
                          {item.hasPreparedDocuments ? "기본 서류 확인됨" : "자료 확인 필요"}
                        </p>
                        {(item.publicTrackingCode || item.email) && (
                          <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            {item.publicTrackingCode && (
                              <button
                                type="button"
                                title="트래킹 코드 복사"
                                className="rounded px-1.5 py-0.5 text-xs hover:bg-surface-strong"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(item.publicTrackingCode!);
                                }}
                              >
                                📋
                              </button>
                            )}
                            {item.email && (
                              <button
                                type="button"
                                title="이메일 보내기"
                                className="rounded px-1.5 py-0.5 text-xs hover:bg-surface-strong"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(`mailto:${item.email}`, "_blank");
                                }}
                              >
                                📧
                              </button>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-line px-3 py-4 text-xs text-text-muted">
                    현재 이 단계에 있는 문의가 없습니다.
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
