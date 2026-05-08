import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableContainer } from "@/components/ui/table";
import {
  getAdminIntakeSourceAnalytics,
  parseIntakeSourceAnalyticsFilters,
  type IntakeSourceAggregateRow,
  type IntakeSourceAnalytics,
  type IntakeSourceContentAggregateRow
} from "@/lib/services/admin-intake-source-analytics";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function asParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function SummaryCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card className="p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-text-strong">{value.toLocaleString("ko-KR")}</p>
      <p className="mt-2 text-sm text-text-muted">{hint}</p>
    </Card>
  );
}

function AggregateTable({
  title,
  rows
}: {
  title: string;
  rows: IntakeSourceAggregateRow[];
}) {
  return (
    <Card className="p-5">
      <h3 className="ui-section-title">{title}</h3>
      {rows.length ? (
        <TableContainer className="mt-4">
          <Table>
            <thead>
              <tr>
                <th>값</th>
                <th>접수 수</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${title}-${row.key}`}>
                  <td className="font-mono text-xs">{row.label}</td>
                  <td>{row.count.toLocaleString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <p className="mt-4 text-sm text-text-muted">데이터 없음</p>
      )}
    </Card>
  );
}

function ContentAggregateTable({ rows }: { rows: IntakeSourceContentAggregateRow[] }) {
  return (
    <Card className="p-5 lg:col-span-2">
      <h3 className="ui-section-title">Content ID별 접수 수</h3>
      {rows.length ? (
        <TableContainer className="mt-4">
          <Table>
            <thead>
              <tr>
                <th>Content ID</th>
                <th>Channel</th>
                <th>Practice area</th>
                <th>접수 수</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.contentId}-${row.channel}-${row.practiceArea}`}>
                  <td className="font-mono text-xs">{row.contentId}</td>
                  <td>{row.channel}</td>
                  <td className="font-mono text-xs">{row.practiceArea}</td>
                  <td>{row.count.toLocaleString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <p className="mt-4 text-sm text-text-muted">데이터 없음</p>
      )}
    </Card>
  );
}

function RecentSourceList({ analytics }: { analytics: IntakeSourceAnalytics }) {
  return (
    <Card className="p-5">
      <h3 className="ui-section-title">최근 유입 접수</h3>
      {analytics.recentItems.length ? (
        <TableContainer className="mt-4">
          <Table>
            <thead>
              <tr>
                <th>접수일</th>
                <th>고객</th>
                <th>Source</th>
                <th>Channel</th>
                <th>Practice area</th>
                <th>Content ID</th>
                <th>Package ID</th>
                <th>접수번호</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentItems.map((item) => (
                <tr key={`${item.detailHref}-${item.createdAt}`}>
                  <td>{formatDateTime(item.createdAt)}</td>
                  <td>{item.contactName}</td>
                  <td>{item.source}</td>
                  <td>{item.channel}</td>
                  <td className="font-mono text-xs">{item.practiceArea}</td>
                  <td className="font-mono text-xs">{item.contentId}</td>
                  <td className="font-mono text-xs">{item.packageId}</td>
                  <td className="font-mono text-xs">{item.publicTrackingCode}</td>
                  <td>
                    <Link className="text-sm font-semibold text-primary hover:underline" href={item.detailHref}>
                      열기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <p className="mt-4 text-sm text-text-muted">데이터 없음</p>
      )}
    </Card>
  );
}

export default async function AdminIntakeSourcesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const filters = parseIntakeSourceAnalyticsFilters(rawParams);
  const analytics = await getAdminIntakeSourceAnalytics(filters);

  return (
    <div className="space-y-6">
      <Card className="ui-analysis-hero p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Admin Analytics</p>
            <h2 className="mt-2 ui-page-title">접수 유입 분석</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              Auto-Sns 및 외부 콘텐츠에서 유입된 접수 흐름을 확인합니다. 기존 Inquiry 유입 필드만 읽어 집계하며, 별도 analytics system이나 public 노출은 없습니다.
            </p>
          </div>
          <Link
            href="/admin/inquiries"
            className="inline-flex h-10 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
          >
            문의 목록
          </Link>
        </div>
      </Card>

      <Card className="p-5">
        <form method="get" className="space-y-4">
          <FieldGroup className="md:grid-cols-4">
            <Field label="시작일">
              <Input name="dateFrom" type="date" defaultValue={asParamValue(rawParams.dateFrom)} />
            </Field>
            <Field label="종료일">
              <Input name="dateTo" type="date" defaultValue={asParamValue(rawParams.dateTo)} />
            </Field>
            <Field label="Source">
              <Input name="source" defaultValue={asParamValue(rawParams.source)} placeholder="autosns" />
            </Field>
            <Field label="Channel">
              <Input name="channel" defaultValue={asParamValue(rawParams.channel)} placeholder="naver" />
            </Field>
            <Field label="Practice area">
              <Input
                name="practice_area"
                defaultValue={asParamValue(rawParams.practice_area)}
                placeholder="middle_east_admin_business"
              />
            </Field>
            <Field label="Content ID">
              <Input name="content_id" defaultValue={asParamValue(rawParams.content_id)} />
            </Field>
            <Field label="Package ID">
              <Input name="package_id" defaultValue={asParamValue(rawParams.package_id)} />
            </Field>
          </FieldGroup>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary">필터 적용</Button>
            <Link
              href="/admin/intake-sources"
              className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              초기화
            </Link>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="전체 접수" value={analytics.summary.totalCount} hint="현재 필터 기준 전체 접수 수" />
        <SummaryCard label="유입 추적 접수" value={analytics.summary.trackedCount} hint="source/channel/content 등 유입 정보가 있는 접수" />
        <SummaryCard label="Auto-Sns 접수" value={analytics.summary.autosnsCount} hint="source=autosns 접수" />
        <SummaryCard label="유입 정보 없음" value={analytics.summary.untrackedCount} hint="캠페인 추적 정보가 없는 접수" />
        <SummaryCard label="최근 7일" value={analytics.summary.recent7DayCount} hint="최근 7일 내 접수" />
        <SummaryCard label="최근 30일" value={analytics.summary.recent30DayCount} hint="최근 30일 내 접수" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AggregateTable title="Source별 접수 수" rows={analytics.sourceCounts} />
        <AggregateTable title="Channel별 접수 수" rows={analytics.channelCounts} />
        <AggregateTable title="Practice area별 접수 수" rows={analytics.practiceAreaCounts} />
        <AggregateTable title="Package ID별 접수 수" rows={analytics.packageCounts} />
        <ContentAggregateTable rows={analytics.contentCounts} />
      </div>

      <RecentSourceList analytics={analytics} />
    </div>
  );
}
