import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { InquiryLabelBadge } from "@/components/admin/inquiry-label-badge";
import { Table, TableContainer } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { scoreTone, type PriorityScore } from "@/lib/services/priority-scoring-service";
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

export function InquiryTable({
  inquiries,
  scores
}: {
  inquiries: InquiryItem[];
  scores?: Record<string, PriorityScore>;
}) {
  return (
    <TableContainer className="hidden lg:block">
      <Table>
        <thead>
          <tr>
            <th>문의</th>
            <th>유형</th>
            <th>상태</th>
            <th>긴급도</th>
            <th>우선순위</th>
            <th>언어</th>
            <th>희망 일정</th>
            <th>다음 연락</th>
            <th>유입</th>
            <th>응답 대기</th>
            <th>자료 상태</th>
            <th>실행 준비도</th>
            <th>업데이트</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inquiry) => {
            const inquiryType = normalizeInquiryType(inquiry.inquiryType);
            const inquiryStatus = normalizeInquiryStatus(inquiry.status);
            const inquiryUrgency = normalizeUrgencyLevel(inquiry.urgencyLevel);
            const inquiryLanguage = normalizeLanguageCode(inquiry.preferredLanguage);

            return (
              <tr key={inquiry.id}>
                <td>
                  <Link href={`/admin/inquiries/${inquiry.id}`} className="block">
                    <p className="truncate whitespace-nowrap font-semibold text-text-strong">
                      {inquiry.title}
                      <InquiryLabelBadge inquiryId={inquiry.id} enabled />
                    </p>
                    <p className="mt-1 truncate whitespace-nowrap text-sm text-text">{inquiry.contactName}</p>
                    <p className="truncate whitespace-nowrap text-sm text-text-muted">
                      {inquiry.organizationName || inquiry.email}
                    </p>
                  </Link>
                </td>
                <td>{getInquiryTypeLabel(inquiryType)}</td>
                <td>
                  <Badge tone="status" status={inquiryStatus}>
                    {getInquiryStatusLabel(inquiryStatus)}
                  </Badge>
                </td>
                <td>
                  <Badge tone="urgency" urgency={inquiryUrgency}>
                    {getUrgencyLabel(inquiryUrgency)}
                  </Badge>
                </td>
                <td>
                  {(() => {
                    const s = scores?.[inquiry.id];
                    if (!s) return <span className="text-xs text-text-muted">-</span>;
                    const t = scoreTone(s.total);
                    return (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${t.className}`}
                        title={s.reasoning}
                      >
                        {t.label} {s.total}
                      </span>
                    );
                  })()}
                </td>
                <td>
                  <Badge tone="language" language={inquiryLanguage}>
                    {getLanguageCodeLabel(inquiryLanguage)}
                  </Badge>
                </td>
                <td>{formatDateTime(inquiry.dueDate)}</td>
                <td>{formatDateTime(inquiry.nextContactAt)}</td>
                <td>
                  {[inquiry.intakeSource, inquiry.intakeChannel, inquiry.intakePracticeArea, inquiry.intakeContentId]
                    .filter(Boolean)
                    .join(" / ") || "-"}
                </td>
                <td>{inquiry.responsePending ? "대기 중" : "-"}</td>
                <td>{inquiry.hasPreparedDocuments ? "기본 서류 보유" : "자료 확인 필요"}</td>
                <td>
                  {inquiry.checklistTotalCount && inquiry.checklistTotalCount > 0
                    ? `${inquiry.checklistProgressPercent ?? 0}% (남음 ${inquiry.checklistPendingCount ?? 0})`
                    : "-"}
                </td>
                <td>{formatDateTime(inquiry.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableContainer>
  );
}
