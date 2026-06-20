import Link from "next/link";

import { CaseAccountingFilterPresets } from "@/components/admin/case-accounting-filter-presets";
import { CaseAccountingSummaryCards } from "@/components/admin/case-accounting-summary-cards";
import { CaseLedgerTable } from "@/components/admin/case-ledger-table";
import { Card } from "@/components/ui/card";
import {
  buildCaseAccountingSummaryViewModel,
  filterLedgerRowsByAccountingPreset,
  listAccountingFilterPresets,
  normalizeAccountingFilterPreset,
  type AccountingFilterPreset
} from "@/lib/services/case-accounting-summary-view-model";
import {
  buildCaseLedgerSummary,
  listCaseLedgerRows,
  mapCaseMatterStatusToLedgerStatus,
  normalizeLedgerFilters,
  type CaseLedgerFilters,
  type CaseLedgerViewModel
} from "@/lib/services/case-ledger-view-model";
import { caseMatterStatusValues } from "@/types/case-matter";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(searchParams: Record<string, string | string[] | undefined>): CaseLedgerFilters {
  return normalizeLedgerFilters({
    dateFrom: pickParam(searchParams.dateFrom),
    dateTo: pickParam(searchParams.dateTo),
    status: pickParam(searchParams.status),
    matterType: pickParam(searchParams.matterType),
    assignedTo: pickParam(searchParams.assignedTo)
  });
}

async function safeListCaseLedgerRows(filters: CaseLedgerFilters): Promise<CaseLedgerViewModel> {
  try {
    return await listCaseLedgerRows(filters);
  } catch (error) {
    logger.error("Failed to load case ledger rows", error);
    return {
      rows: [],
      summary: {
        total: 0,
        active: 0,
        supplement: 0,
        closed: 0,
        submitted: 0
      }
    };
  }
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter((value) => value && value !== "-"))).sort((a, b) =>
    a.localeCompare(b, "ko-KR")
  );
}

function buildExportHref(filters: CaseLedgerFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/api/admin/ledger/export?${query}` : "/api/admin/ledger/export";
}

function buildPresetHref(filters: CaseLedgerFilters, preset: AccountingFilterPreset) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  if (preset !== "all") params.set("accountingPreset", preset);
  const query = params.toString();
  return query ? `/admin/ledger?${query}` : "/admin/ledger";
}

export default async function AdminLedgerPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const filters = parseFilters(params);
  const accountingPreset = normalizeAccountingFilterPreset(pickParam(params.accountingPreset));
  const viewModel = await safeListCaseLedgerRows(filters);
  const filteredRows = filterLedgerRowsByAccountingPreset(viewModel.rows, accountingPreset);
  const filteredViewModel: CaseLedgerViewModel = {
    rows: filteredRows,
    summary: buildCaseLedgerSummary(filteredRows)
  };
  const accountingSummary = buildCaseAccountingSummaryViewModel(filteredViewModel.rows);
  const accountingFilterItems = listAccountingFilterPresets().map((item) => ({
    ...item,
    count: filterLedgerRowsByAccountingPreset(viewModel.rows, item.preset).length,
    href: buildPresetHref(filters, item.preset)
  }));
  const statusOptions = caseMatterStatusValues.map((status) => ({
    value: status,
    label: mapCaseMatterStatusToLedgerStatus(status)
  }));
  const matterTypeOptions = uniqueValues(viewModel.rows.map((row) => row.matterType));
  const assignedToOptions = uniqueValues(viewModel.rows.map((row) => row.assignedTo));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Case Ledger</p>
            <h2 className="mt-2 ui-page-title">업무처리부 / 수임관리대장</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              CaseMatter 데이터를 기반으로 자동 생성되는 read-only 장부입니다. 수임료와 입금
              상태는 다음 단계에서 수동 관리 필드로 확장합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/cases"
              className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
            >
              사건 운영판
            </Link>
            <Link
              href={buildExportHref(filters)}
              className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white transition hover:bg-trust"
            >
              CSV export
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">전체 사건</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{viewModel.summary.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">진행 중</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{viewModel.summary.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">보완 이력</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{viewModel.summary.supplement}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">종결</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{viewModel.summary.closed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">제출 이력 있음</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{viewModel.summary.submitted}</p>
        </Card>
      </div>

      <CaseAccountingSummaryCards summary={accountingSummary} />

      <CaseAccountingFilterPresets activePreset={accountingPreset} items={accountingFilterItems} />

      <CaseLedgerTable
        viewModel={filteredViewModel}
        filters={filters}
        accountingPreset={accountingPreset}
        statusOptions={statusOptions}
        matterTypeOptions={matterTypeOptions}
        assignedToOptions={assignedToOptions}
      />
    </div>
  );
}
