"use client";

import { useMemo, useState } from "react";

import { CasesTable, type CaseRow } from "./cases-table";
import { TableFilters, type FilterDefinition } from "./table-filters";

const STATUS_OPTIONS = [
  { value: "접수 검토", label: "접수 검토" },
  { value: "상담 진행", label: "상담 진행" },
  { value: "견적 제안", label: "견적 제안" },
  { value: "계약 대기", label: "계약 대기" },
  { value: "사건 진행", label: "사건 진행" },
  { value: "서류 수집", label: "서류 수집" },
  { value: "서류 검토", label: "서류 검토" },
  { value: "제출 준비 완료", label: "제출 준비 완료" },
  { value: "제출 완료", label: "제출 완료" },
  { value: "보완 요청", label: "보완 요청" },
  { value: "기관 심사 대기", label: "기관 심사 대기" },
  { value: "결과 수신", label: "결과 수신" },
  { value: "종결 처리", label: "종결 처리" },
  { value: "종결", label: "종결" },
  { value: "취소", label: "취소" },
  { value: "보류", label: "보류" },
];

const PENDING_DOCS_OPTIONS = [
  { value: "0", label: "없음 (0건)" },
  { value: "1+", label: "있음 (1건 이상)" },
];

export function CasesTableWithFilters({ rows }: { rows: CaseRow[] }) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: "",
    pendingDocs: "",
  });

  const filters: FilterDefinition[] = [
    {
      key: "status",
      label: "상태",
      options: STATUS_OPTIONS,
      value: filterValues.status,
    },
    {
      key: "pendingDocs",
      label: "미비서류",
      options: PENDING_DOCS_OPTIONS,
      value: filterValues.pendingDocs,
    },
  ];

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filterValues.status && row.statusLabel !== filterValues.status) {
        return false;
      }
      if (filterValues.pendingDocs === "0" && row.pendingDocs !== 0) {
        return false;
      }
      if (filterValues.pendingDocs === "1+" && row.pendingDocs <= 0) {
        return false;
      }
      return true;
    });
  }, [rows, filterValues]);

  return (
    <div className="space-y-3">
      <TableFilters filters={filters} onChange={setFilterValues} />
      <CasesTable rows={filteredRows} />
    </div>
  );
}
