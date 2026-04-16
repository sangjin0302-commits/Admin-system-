import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableContainer } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import {
  inquiryStatusLabels,
  inquiryTypeLabels,
  languageCodeLabels,
  urgencyLabels
} from "@/types/inquiry";

type InquiryItem = {
  id: string;
  title: string;
  contactName: string;
  organizationName: string | null;
  email: string;
  inquiryType: keyof typeof inquiryTypeLabels;
  status: keyof typeof inquiryStatusLabels;
  urgencyLevel: keyof typeof urgencyLabels;
  preferredLanguage: keyof typeof languageCodeLabels;
  assignee: string | null;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date | null;
  hasPreparedDocuments?: boolean;
};

export function InquiryTable({ inquiries }: { inquiries: InquiryItem[] }) {
  return (
    <TableContainer className="hidden lg:block">
      <Table>
        <thead>
          <tr>
            <th>문의</th>
            <th>유형</th>
            <th>상태</th>
            <th>긴급도</th>
            <th>언어</th>
            <th>담당자</th>
            <th>희망 일정</th>
            <th>자료 상태</th>
            <th>업데이트</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inquiry) => {
            const inquiryType = inquiry.inquiryType as keyof typeof inquiryTypeLabels;
            const inquiryStatus = inquiry.status as keyof typeof inquiryStatusLabels;
            const inquiryUrgency = inquiry.urgencyLevel as keyof typeof urgencyLabels;
            const inquiryLanguage = inquiry.preferredLanguage as keyof typeof languageCodeLabels;

            return (
              <tr key={inquiry.id}>
                <td>
                  <Link href={`/admin/inquiries/${inquiry.id}`} className="block">
                    <p className="font-semibold text-text-strong">{inquiry.title}</p>
                    <p className="mt-1 text-sm text-text">{inquiry.contactName}</p>
                    <p className="text-sm text-text-muted">
                      {inquiry.organizationName || inquiry.email}
                    </p>
                  </Link>
                </td>
                <td>{inquiryTypeLabels[inquiryType].ko}</td>
                <td>
                  <Badge tone="status" status={inquiry.status}>
                    {inquiryStatusLabels[inquiryStatus].ko}
                  </Badge>
                </td>
                <td>
                  <Badge tone="urgency" urgency={inquiry.urgencyLevel}>
                    {urgencyLabels[inquiryUrgency].ko}
                  </Badge>
                </td>
                <td>
                  <Badge tone="language" language={inquiry.preferredLanguage}>
                    {languageCodeLabels[inquiryLanguage].ko}
                  </Badge>
                </td>
                <td>{inquiry.assignee || "미배정"}</td>
                <td>{formatDateTime(inquiry.dueDate)}</td>
                <td>{inquiry.hasPreparedDocuments ? "기본 서류 보유" : "자료 확인 필요"}</td>
                <td>{formatDateTime(inquiry.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableContainer>
  );
}
