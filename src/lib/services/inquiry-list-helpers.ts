import type { Prisma } from "@generated/prisma-client/client";

import type {
  AdminSort,
  InquiryStatus,
  InquiryStatusGroup,
  InquiryType,
  LanguageCode,
  UrgencyLevel
} from "@/types/inquiry";
import {
  getInquiryStatusGroupStatuses,
  getUrgencyRank
} from "@/types/inquiry";

export type InquiryListFilters = {
  q?: string;
  inquiryType?: InquiryType;
  status?: InquiryStatus;
  statusGroup?: InquiryStatusGroup;
  urgency?: UrgencyLevel;
  language?: LanguageCode;
  assignee?: string;
  retained?: "all" | "won" | "active";
  sort?: AdminSort;
};

export function buildInquiryListWhere(filters: InquiryListFilters): Prisma.InquiryWhereInput {
  const groupedStatuses = filters.statusGroup ? getInquiryStatusGroupStatuses(filters.statusGroup) : undefined;
  const statusFilter: Prisma.InquiryWhereInput["status"] =
    filters.status ??
    (groupedStatuses && groupedStatuses.length > 0 ? { in: groupedStatuses } : undefined) ??
    (filters.retained === "won"
      ? "WON"
      : filters.retained === "active"
        ? { notIn: ["WON", "CLOSED"] }
        : undefined);

  return {
    inquiryType: filters.inquiryType,
    status: statusFilter,
    urgencyLevel: filters.urgency,
    preferredLanguage: filters.language,
    ...(filters.assignee
      ? {
          assignee: { contains: filters.assignee }
        }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q } },
            { description: { contains: filters.q } },
            { contactName: { contains: filters.q } },
            { organizationName: { contains: filters.q } },
            { email: { contains: filters.q } }
          ]
        }
      : {})
  };
}

export function sortInquiriesByUrgency<T extends { urgencyLevel: UrgencyLevel; createdAt: Date }>(
  inquiries: T[]
) {
  return [...inquiries].sort((a, b) => {
    const urgencyDiff = getUrgencyRank(b.urgencyLevel) - getUrgencyRank(a.urgencyLevel);
    if (urgencyDiff !== 0) return urgencyDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}
