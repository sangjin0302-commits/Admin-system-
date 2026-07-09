"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { InquiryLabelBadge } from "@/components/admin/inquiry-label-badge";
import { Card } from "@/components/ui/card";
import { usePreloadOnHover } from "@/lib/hooks/use-tab-preload";
import { formatDateTime } from "@/lib/utils";
import {
  getInquiryStatusLabel,
  getInquiryTypeLabel,
  getLanguageCodeLabel,
  getUrgencyLabel,
  normalizeInquiryStatus,
  normalizeInquiryType,
  normalizeLanguageCode,
  normalizeUrgencyLevel
} from "@/types/inquiry";

type InquiryItem = {
  id: string;
  title: string;
  generatedSummary: string;
  contactName: string;
  organizationName: string | null;
  email: string;
  inquiryType: string;
  status: string;
  urgencyLevel: string;
  preferredLanguage: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date | null;
  nextContactAt?: Date | null;
  hasPreparedDocuments?: boolean;
  responsePending?: boolean;
  intakeSource?: string | null;
  intakeChannel?: string | null;
  intakePracticeArea?: string | null;
  intakeContentId?: string | null;
  checklistProgressPercent?: number;
  checklistPendingCount?: number;
  checklistTotalCount?: number;
};

export function InquiryCardList({ inquiries }: { inquiries: InquiryItem[] }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {inquiries.map((inquiry) => {
        const inquiryType = normalizeInquiryType(inquiry.inquiryType);
        const inquiryStatus = normalizeInquiryStatus(inquiry.status);
        const inquiryUrgency = normalizeUrgencyLevel(inquiry.urgencyLevel);
        const inquiryLanguage = normalizeLanguageCode(inquiry.preferredLanguage);

        return (
          <InquiryCardLink key={inquiry.id} id={inquiry.id}>
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="urgency" urgency={inquiryUrgency}>
                  {getUrgencyLabel(inquiryUrgency)}
                </Badge>
                <Badge tone="status" status={inquiryStatus}>
                  {getInquiryStatusLabel(inquiryStatus)}
                </Badge>
                <Badge tone="language" language={inquiryLanguage}>
                  {getLanguageCodeLabel(inquiryLanguage)}
                </Badge>
              </div>
              <h3 className="mt-3 truncate whitespace-nowrap text-base font-semibold text-text-strong">
                {inquiry.title}
                <InquiryLabelBadge inquiryId={inquiry.id} enabled />
              </h3>
              <p className="mt-2 truncate whitespace-nowrap text-sm text-text">{inquiry.generatedSummary}</p>
              <div className="mt-3 grid gap-1 text-sm text-text-muted">
                <p className="truncate whitespace-nowrap">
                  {inquiry.contactName}
                  {inquiry.organizationName ? ` · ${inquiry.organizationName}` : ""}
                </p>
                <p className="truncate whitespace-nowrap">{getInquiryTypeLabel(inquiryType)}</p>
                <p className="truncate whitespace-nowrap">접수일: {formatDateTime(inquiry.createdAt)}</p>
                <p className="truncate whitespace-nowrap">희망 일정: {formatDateTime(inquiry.dueDate)}</p>
                <p className="truncate whitespace-nowrap">다음 연락 예정: {formatDateTime(inquiry.nextContactAt)}</p>
                <p className="truncate whitespace-nowrap">
                  유입: {[inquiry.intakeSource, inquiry.intakeChannel, inquiry.intakePracticeArea, inquiry.intakeContentId]
                    .filter(Boolean)
                    .join(" / ") || "-"}
                </p>
                <p className="truncate whitespace-nowrap">응답 대기: {inquiry.responsePending ? "대기 중" : "없음"}</p>
                <p className="truncate whitespace-nowrap">자료 준비: {inquiry.hasPreparedDocuments ? "기본 서류 보유" : "자료 확인 필요"}</p>
                <p className="truncate whitespace-nowrap">
                  실행 준비도:{" "}
                  {inquiry.checklistTotalCount && inquiry.checklistTotalCount > 0
                    ? `${inquiry.checklistProgressPercent ?? 0}% (남음 ${inquiry.checklistPendingCount ?? 0}건)`
                    : "체크리스트 대기"}
                </p>
              </div>
            </Card>
          </InquiryCardLink>
        );
      })}
    </div>
  );
}

function InquiryCardLink({ id, children }: { id: string; children: React.ReactNode }) {
  const { hoverHandler, leaveHandler } = usePreloadOnHover(id, "inquiry");
  return (
    <Link
      href={`/admin/inquiries/${id}`}
      onMouseEnter={hoverHandler}
      onMouseLeave={leaveHandler}
      onFocus={hoverHandler}
    >
      {children}
    </Link>
  );
}
