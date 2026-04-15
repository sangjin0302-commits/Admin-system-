import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableContainer } from "@/components/ui/table";
import { deriveInquiryScreening } from "@/lib/intake-screening/service";
import { formatDateTime } from "@/lib/utils";
import {
  inquiryStatusLabels,
  inquiryTypeLabels,
  languageCodeLabels,
  screeningGradeLabels,
  type InquiryStatus,
  type InquiryType,
  type LanguageCode,
  type UrgencyLevel,
  urgencyLabels
} from "@/types/inquiry";

type InquiryItem = {
  id: string;
  title: string;
  contactName: string;
  organizationName: string | null;
  email: string;
  inquiryType: InquiryType;
  status: InquiryStatus;
  urgencyLevel: UrgencyLevel;
  preferredLanguage: LanguageCode;
  qualificationScore: number;
  classificationConfidence: number;
  consultationRequired: boolean;
  hasPreparedDocuments: boolean;
  needsTranslation: boolean;
  isCorporateRequest: boolean;
  dueDate: Date | null;
  assignee: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function InquiryTable({ inquiries }: { inquiries: InquiryItem[] }) {
  return (
    <TableContainer className="hidden lg:block">
      <Table>
        <thead>
          <tr>
            <th>문의</th>
            <th>유형</th>
            <th>선별</th>
            <th>상태</th>
            <th>긴급도</th>
            <th>언어</th>
            <th>담당자</th>
            <th>접수일</th>
            <th>업데이트</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inquiry) => {
            const screening = deriveInquiryScreening({
              id: inquiry.id,
              qualificationScore: inquiry.qualificationScore,
              classificationConfidence: inquiry.classificationConfidence,
              urgencyLevel: inquiry.urgencyLevel,
              consultationRequired: inquiry.consultationRequired,
              hasPreparedDocuments: inquiry.hasPreparedDocuments,
              needsTranslation: inquiry.needsTranslation,
              isCorporateRequest: inquiry.isCorporateRequest,
              dueDate: inquiry.dueDate,
              preferredLanguage: inquiry.preferredLanguage,
              status: inquiry.status
            });

            return (
              <tr key={inquiry.id}>
                <td>
                  <Link href={`/admin/inquiries/${inquiry.id}`} className="block">
                    <p className="font-semibold tracking-[-0.01em] text-text-strong">{inquiry.title}</p>
                    <p className="mt-1 text-sm font-medium text-text">{inquiry.contactName}</p>
                    <p className="text-sm text-text-muted">{inquiry.organizationName || inquiry.email}</p>
                  </Link>
                </td>
                <td>{inquiryTypeLabels[inquiry.inquiryType].ko}</td>
                <td>
                  <div className="space-y-1">
                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                      {screeningGradeLabels[screening.grade].ko}
                    </Badge>
                    <p className="text-xs text-text-muted">{screening.headline}</p>
                  </div>
                </td>
                <td>
                  <Badge tone="status" status={inquiry.status}>
                    {inquiryStatusLabels[inquiry.status].ko}
                  </Badge>
                </td>
                <td>
                  <Badge tone="urgency" urgency={inquiry.urgencyLevel}>
                    {urgencyLabels[inquiry.urgencyLevel].ko}
                  </Badge>
                </td>
                <td>
                  <Badge tone="language" language={inquiry.preferredLanguage}>
                    {languageCodeLabels[inquiry.preferredLanguage].ko}
                  </Badge>
                </td>
                <td>{inquiry.assignee || "-"}</td>
                <td>{formatDateTime(inquiry.createdAt)}</td>
                <td>{formatDateTime(inquiry.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableContainer>
  );
}
