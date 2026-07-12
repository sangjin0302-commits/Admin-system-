"use client";

import { useMemo } from "react";

import { InquiryDataTable } from "./inquiry-data-table";
import { inquiryColumns, type InquiryRow } from "./inquiry-columns";

interface InquiryTanstackWrapperProps {
  inquiries: any[];
}

export function InquiryTanstackWrapper({ inquiries }: InquiryTanstackWrapperProps) {
  const rows = useMemo<InquiryRow[]>(
    () =>
      inquiries.map((item) => ({
        id: item.id,
        contactName: item.contactName ?? "",
        status: item.status ?? "",
        phone: item.phone ?? null,
        email: item.email ?? "",
        inquiryType: item.inquiryType ?? "",
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      })),
    [inquiries],
  );

  return <InquiryDataTable data={rows} columns={inquiryColumns} />;
}
