"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import {
  getInquiryStatusLabel,
  getInquiryTypeLabel,
  normalizeInquiryStatus,
  normalizeInquiryType,
} from "@/types/inquiry";

export type InquiryRow = {
  id: string;
  contactName: string;
  status: string;
  phone?: string | null;
  email: string;
  inquiryType: string;
  createdAt: Date;
};

const STATUS_TONE: Record<string, string> = {
  new: "bg-info/10 text-info",
  in_progress: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
  closed: "bg-surface-muted text-text-muted",
  pending: "bg-primary-soft text-primary",
};

function statusBadgeClass(raw: string): string {
  const normalized = normalizeInquiryStatus(raw);
  return STATUS_TONE[normalized] ?? "bg-surface-muted text-text-muted";
}

export const inquiryColumns: ColumnDef<InquiryRow>[] = [
  {
    accessorKey: "contactName",
    header: "이름",
    cell: ({ row }) => (
      <span className="font-medium text-text-strong">{row.getValue("contactName")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "상태",
    cell: ({ row }) => {
      const raw = row.getValue<string>("status");
      const normalized = normalizeInquiryStatus(raw);
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(raw)}`}
        >
          {getInquiryStatusLabel(normalized)}
        </span>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "전화",
    cell: ({ row }) => row.getValue("phone") ?? "-",
  },
  {
    accessorKey: "email",
    header: "이메일",
    cell: ({ row }) => (
      <span className="truncate text-sm">{row.getValue("email")}</span>
    ),
  },
  {
    accessorKey: "inquiryType",
    header: "유형",
    cell: ({ row }) => {
      const normalized = normalizeInquiryType(row.getValue<string>("inquiryType"));
      return getInquiryTypeLabel(normalized);
    },
  },
  {
    accessorKey: "createdAt",
    header: "접수일",
    cell: ({ row }) => {
      const date = row.getValue<Date>("createdAt");
      if (!date) return "-";
      return format(new Date(date), "yyyy.MM.dd (EEE)", { locale: ko });
    },
    sortingFn: "datetime",
  },
  {
    id: "actions",
    header: "액션",
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/admin/inquiries/${row.original.id}`}
        className="inline-flex items-center rounded-full border border-line px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary-soft"
      >
        상세
      </Link>
    ),
  },
];
