import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  generatedSummary: string;
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

export function InquiryCardList({ inquiries }: { inquiries: InquiryItem[] }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {inquiries.map((inquiry) => {
        const inquiryType = inquiry.inquiryType as keyof typeof inquiryTypeLabels;
        const inquiryStatus = inquiry.status as keyof typeof inquiryStatusLabels;
        const inquiryUrgency = inquiry.urgencyLevel as keyof typeof urgencyLabels;
        const inquiryLanguage = inquiry.preferredLanguage as keyof typeof languageCodeLabels;

        return (
          <Link key={inquiry.id} href={`/admin/inquiries/${inquiry.id}`}>
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="urgency" urgency={inquiry.urgencyLevel}>
                  {urgencyLabels[inquiryUrgency].ko}
                </Badge>
                <Badge tone="status" status={inquiry.status}>
                  {inquiryStatusLabels[inquiryStatus].ko}
                </Badge>
                <Badge tone="language" language={inquiry.preferredLanguage}>
                  {languageCodeLabels[inquiryLanguage].ko}
                </Badge>
              </div>
              <h3 className="mt-3 text-base font-semibold text-text-strong">{inquiry.title}</h3>
              <p className="mt-2 max-h-12 overflow-hidden text-sm text-text">{inquiry.generatedSummary}</p>
              <div className="mt-3 grid gap-1 text-sm text-text-muted">
                <p>
                  {inquiry.contactName}
                  {inquiry.organizationName ? ` · ${inquiry.organizationName}` : ""}
                </p>
                <p>{inquiryTypeLabels[inquiryType].ko}</p>
                <p>담당자: {inquiry.assignee || "미배정"}</p>
                <p>접수일: {formatDateTime(inquiry.createdAt)}</p>
                <p>희망 일정: {formatDateTime(inquiry.dueDate)}</p>
                <p>자료 준비: {inquiry.hasPreparedDocuments ? "기본 서류 보유" : "자료 확인 필요"}</p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
