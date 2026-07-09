"use client";

import Link from "next/link";
import { CaseDelayBadge } from "@/components/admin/case-delay-badge";
import { SortableTable } from "./sortable-table";
import { usePreloadOnHover } from "@/lib/hooks/use-tab-preload";

type CaseRow = {
  id: string;
  title: string;
  caseNo: string | null;
  matterTypeLabel: string;
  statusLabel: string;
  nextActionMessage: string;
  nextActionMeta: string;
  dueDate: string | null;
  pendingDocs: number;
  updatedAt: string;
  createdAt: string;
  matterType: string;
};

const columns = [
  {
    key: "title",
    label: "사건",
    sortable: true,
    getValue: (r: CaseRow) => r.title,
    render: (r: CaseRow) => (
      <div>
        <p className="font-semibold text-text-strong">
          {r.title}
          <CaseDelayBadge caseId={r.id} createdAt={new Date(r.createdAt)} matterType={r.matterType} enabled />
        </p>
        <p className="mt-1 text-xs text-text-muted">{r.caseNo ?? "사건번호 미정"} | {r.matterTypeLabel}</p>
      </div>
    ),
  },
  {
    key: "status",
    label: "상태",
    sortable: true,
    getValue: (r: CaseRow) => r.statusLabel,
    render: (r: CaseRow) => <span className="text-text">{r.statusLabel}</span>,
  },
  {
    key: "nextAction",
    label: "다음 조치",
    sortable: false,
    render: (r: CaseRow) => (
      <div>
        <p className="font-medium text-text-strong">{r.nextActionMessage}</p>
        <p className="mt-1 text-xs text-text-muted">{r.nextActionMeta}</p>
      </div>
    ),
  },
  {
    key: "dueDate",
    label: "기한",
    sortable: true,
    getValue: (r: CaseRow) => r.dueDate,
    render: (r: CaseRow) => <span className="text-text">{r.dueDate ?? "—"}</span>,
  },
  {
    key: "pendingDocs",
    label: "미비서류",
    sortable: true,
    getValue: (r: CaseRow) => r.pendingDocs,
    render: (r: CaseRow) => (
      <span className={r.pendingDocs > 0 ? "font-semibold text-warning" : "text-text"}>
        {r.pendingDocs}
      </span>
    ),
  },
  {
    key: "updatedAt",
    label: "업데이트",
    sortable: true,
    getValue: (r: CaseRow) => r.updatedAt,
    render: (r: CaseRow) => <span className="text-text-muted">{r.updatedAt}</span>,
  },
  {
    key: "action",
    label: "",
    render: (r: CaseRow) => <CaseDetailLink id={r.id} />,
  },
];

function CaseDetailLink({ id }: { id: string }) {
  const { hoverHandler, leaveHandler } = usePreloadOnHover(id, "case");
  return (
    <Link
      href={`/admin/cases/${id}`}
      onMouseEnter={hoverHandler}
      onMouseLeave={leaveHandler}
      onFocus={hoverHandler}
      className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
    >
      상세
    </Link>
  );
}

export function CasesTable({ rows }: { rows: CaseRow[] }) {
  return (
    <SortableTable
      data={rows}
      columns={columns}
      getKey={(r) => r.id}
      pageSize={15}
      emptyMessage="사건 데이터가 없습니다."
    />
  );
}

export type { CaseRow };
