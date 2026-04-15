import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import {
  inquiryStatusLabels,
  inquiryTypeLabels,
  languageCodeLabels,
  urgencyLabels,
  type InquiryStatus,
  type InquiryType,
  type LanguageCode,
  type UrgencyLevel
} from "@/types/inquiry";

type InquiryItem = {
  id: string;
  title: string;
  generatedSummary: string;
  contactName: string;
  organizationName: string | null;
  email: string;
  inquiryType: InquiryType;
  status: InquiryStatus;
  urgencyLevel: UrgencyLevel;
  preferredLanguage: LanguageCode;
  assignee: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function InquiryCardList({ inquiries }: { inquiries: InquiryItem[] }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {inquiries.map((inquiry) => (
        <Link key={inquiry.id} href={`/admin/inquiries/${inquiry.id}`}>
          <Card className="p-4 transition hover:border-line-strong hover:shadow-floating">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="urgency" urgency={inquiry.urgencyLevel}>
                {urgencyLabels[inquiry.urgencyLevel].ko}
              </Badge>
              <Badge tone="status" status={inquiry.status}>
                {inquiryStatusLabels[inquiry.status].ko}
              </Badge>
              <Badge tone="language" language={inquiry.preferredLanguage}>
                {languageCodeLabels[inquiry.preferredLanguage].ko}
              </Badge>
            </div>
            <h3 className="mt-3 text-base font-semibold text-text-strong">{inquiry.title}</h3>
            <p className="mt-2 max-h-12 overflow-hidden text-sm leading-6 text-text">
              {inquiry.generatedSummary}
            </p>
            <div className="mt-3 grid gap-1 text-sm text-text-muted">
              <p>
                {inquiry.contactName}
                {inquiry.organizationName ? ` · ${inquiry.organizationName}` : ""}
              </p>
              <p className="font-medium text-text">{inquiryTypeLabels[inquiry.inquiryType].ko}</p>
              <p>담당자: {inquiry.assignee || "-"}</p>
              <p>접수일: {formatDateTime(inquiry.createdAt)}</p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
