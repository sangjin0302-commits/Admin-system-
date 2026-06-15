import Link from "next/link";

import { Card } from "@/components/ui/card";
import { formatCaseMatterTypeLabel } from "@/lib/immigration";
import type { getCaseMatterById } from "@/lib/services/case-matter-service";
import {
  buildCaseMatterDDay,
  buildRequiredDocumentStatusCounts,
  buildTaskDueState,
  isRequiredDocumentBacklog
} from "@/lib/services/case-matter-card-view-model";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import {
  getCaseMatterStatusLabel,
  getRequiredDocumentStatusLabel,
  type CaseMatterStatusValue,
  type RequiredDocumentStatusValue
} from "@/types/case-matter";

type CaseMatterDetail = NonNullable<Awaited<ReturnType<typeof getCaseMatterById>>>;
type UiLocale = "ko" | "en";

function valueOrDash(value: string | null | undefined) {
  return value?.trim() ? value : "-";
}

function MiniField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-xl border border-line bg-surface-muted p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-text-strong">{value ?? "-"}</p>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-semibold text-text-strong">{title}</h3>
      {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
    </div>
  );
}

export function CaseMatterSummaryCards({
  caseMatter,
  status,
  locale
}: {
  caseMatter: CaseMatterDetail;
  status: CaseMatterStatusValue;
  locale: UiLocale;
}) {
  const dueDDay = buildCaseMatterDDay(caseMatter.dueDate);
  const nextActionDDay = buildCaseMatterDDay(caseMatter.nextActionAt);

  return (
    <Card className="p-6">
      <SectionTitle
        title="사건 요약"
        description="사건 진행에 필요한 핵심 운영 정보를 한 화면에서 확인합니다."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniField label="사건번호" value={caseMatter.caseNo ?? "사건번호 없음"} />
        <MiniField label="사건명" value={caseMatter.title} />
        <MiniField label="업무유형" value={formatCaseMatterTypeLabel(caseMatter.matterType)} />
        <MiniField label="진행상태" value={getCaseMatterStatusLabel(status, locale)} />
        <MiniField label="우선순위" value={caseMatter.priority} />
        <MiniField label="리스크" value={caseMatter.riskLevel} />
        <MiniField label="담당자" value={caseMatter.assignedTo ?? "미지정"} />
        <MiniField label="D-day" value={`${dueDDay.label} / 다음 액션 ${nextActionDDay.label}`} />
        <MiniField label="개시일" value={formatDate(caseMatter.openedAt)} />
        <MiniField label="종결일" value={formatDate(caseMatter.closedAt)} />
        <MiniField label="기한" value={formatDate(caseMatter.dueDate)} />
        <MiniField label="다음 액션일" value={formatDateTime(caseMatter.nextActionAt)} />
      </div>
    </Card>
  );
}

export function CaseMatterPartiesSection({ parties }: { parties: CaseMatterDetail["parties"] }) {
  return (
    <Card className="p-6">
      <SectionTitle title="의뢰인/관계자" description="CLIENT 역할은 의뢰인으로 우선 확인합니다." />
      {parties.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface-muted p-3 text-sm text-text-muted">
          등록된 의뢰인/관계자가 없습니다.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {parties.map((party) => (
            <div
              key={party.id}
              className={cn(
                "rounded-xl border border-line bg-surface-muted p-4",
                party.role === "CLIENT" && "border-trust bg-trust/5"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-text-strong">{party.name}</p>
                <span className="rounded-full bg-surface px-2 py-1 text-xs font-semibold text-text-muted">
                  {party.role === "CLIENT" ? "CLIENT / 의뢰인" : party.role}
                </span>
              </div>
              <dl className="mt-3 grid gap-2 text-sm text-text sm:grid-cols-2">
                <div><dt className="text-xs text-text-muted">전화</dt><dd>{valueOrDash(party.phone)}</dd></div>
                <div><dt className="text-xs text-text-muted">이메일</dt><dd className="break-all">{valueOrDash(party.email)}</dd></div>
                <div><dt className="text-xs text-text-muted">소속</dt><dd>{valueOrDash(party.organization)}</dd></div>
                <div><dt className="text-xs text-text-muted">국적</dt><dd>{valueOrDash(party.nationality)}</dd></div>
              </dl>
              {party.memo ? <p className="mt-3 text-sm text-text-muted">{party.memo}</p> : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function CaseMatterInquiryLinkSection({
  inquiry
}: {
  inquiry: CaseMatterDetail["inquiry"];
}) {
  return (
    <Card className="p-6">
      <SectionTitle title="원 문의 연결" description="사건으로 전환된 최초 문의의 최소 운영 정보입니다." />
      {!inquiry ? (
        <p className="rounded-xl border border-line bg-surface-muted p-3 text-sm text-text-muted">
          연결된 원 문의가 없습니다.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniField label="문의 제목" value={inquiry.title} />
            <MiniField label="고객명" value={inquiry.contactName} />
            <MiniField label="이메일" value={inquiry.email} />
            <MiniField label="전화" value={inquiry.phone ?? "-"} />
            <MiniField label="문의 유형" value={inquiry.inquiryType} />
            <MiniField label="긴급도" value={inquiry.urgencyLevel} />
            <MiniField label="고객용 접수번호" value={inquiry.publicTrackingCode ?? "-"} />
          </div>
          <Link
            href={`/admin/inquiries/${inquiry.id}`}
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
          >
            원 문의 상세 보기
          </Link>
        </div>
      )}
    </Card>
  );
}

export function RequiredDocumentSummarySection({
  documents,
  locale
}: {
  documents: Array<{ status: RequiredDocumentStatusValue; name: string; dueDate: Date | null; required: boolean }>;
  locale: UiLocale;
}) {
  const counts = buildRequiredDocumentStatusCounts(documents);
  const backlog = documents.filter((document) => isRequiredDocumentBacklog(document.status));
  const visibleStatuses: RequiredDocumentStatusValue[] = [
    "NEEDED",
    "REQUESTED",
    "RECEIVED",
    "IN_REVIEW",
    "NEEDS_FIX",
    "APPROVED"
  ];

  return (
    <Card className="p-6">
      <SectionTitle
        title="필수자료 현황"
        description="미제출/요청/보완 필요 자료를 먼저 확인합니다."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {visibleStatuses.map((status) => (
          <MiniField key={status} label={getRequiredDocumentStatusLabel(status, locale)} value={counts[status]} />
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-line bg-surface-muted p-4">
        <p className="text-sm font-semibold text-text-strong">즉시 확인할 자료</p>
        {backlog.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">미제출/보완 필요 자료가 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {backlog.map((document) => (
              <li key={`${document.name}-${document.status}`} className="text-sm text-text">
                <span className="font-semibold text-text-strong">{document.name}</span>{" "}
                <span className="text-text-muted">
                  ({getRequiredDocumentStatusLabel(document.status, locale)} / {formatDate(document.dueDate)})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export function CaseMatterTaskSection({ tasks }: { tasks: CaseMatterDetail["tasks"] }) {
  return (
    <Card className="p-6">
      <SectionTitle title="업무 태스크" description="이번 화면에서는 생성/수정 없이 읽기 전용으로 표시합니다." />
      {tasks.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface-muted p-3 text-sm text-text-muted">
          등록된 업무 태스크가 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2">Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tasks.map((task) => {
                const dueState = buildTaskDueState(task.dueDate);
                return (
                  <tr key={task.id} className="align-top">
                    <td className="px-3 py-3 font-medium text-text-strong">{task.title}</td>
                    <td className="px-3 py-3 text-text">{task.status}</td>
                    <td className="px-3 py-3 text-text">{task.priority}</td>
                    <td className="px-3 py-3 text-text">
                      {formatDate(task.dueDate)}
                      {dueState !== "normal" ? (
                        <span className="ml-2 rounded-full bg-surface-muted px-2 py-1 text-xs font-semibold text-text-muted">
                          {dueState === "overdue" ? "overdue" : dueState === "due_today" ? "today" : "due soon"}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-text-muted">{valueOrDash(task.assignedTo)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function CaseMatterSubmissionSection({
  submissionPackages,
  submissions,
  supplementRequests
}: {
  submissionPackages: CaseMatterDetail["submissionPackages"];
  submissions: CaseMatterDetail["submissions"];
  supplementRequests: CaseMatterDetail["supplementRequests"];
}) {
  return (
    <Card className="p-6">
      <SectionTitle title="제출/보완" description="제출 패키지, 기관 제출, 보완 요청 이력을 읽기 전용으로 확인합니다." />
      <div className="grid gap-4 xl:grid-cols-3">
        <MiniList
          title="제출 패키지"
          empty="등록된 제출 패키지가 없습니다."
          rows={submissionPackages.map((item) => ({
            id: item.id,
            title: item.title,
            meta: `${item.status} / ${valueOrDash(item.targetAgency)} / ${formatDateTime(item.updatedAt)}`
          }))}
        />
        <MiniList
          title="기관 제출"
          empty="등록된 제출 이력이 없습니다."
          rows={submissions.map((item) => ({
            id: item.id,
            title: item.agencyName,
            meta: `${item.status} / ${item.method} / 접수번호 ${valueOrDash(item.receiptNo)}`
          }))}
        />
        <MiniList
          title="보완 요청"
          empty="보완 요청 이력이 없습니다."
          rows={supplementRequests.map((item) => ({
            id: item.id,
            title: item.title,
            meta: `${item.status} / 기한 ${formatDate(item.dueDate)} / 응답 ${formatDate(item.respondedAt)}`
          }))}
        />
      </div>
    </Card>
  );
}

function MiniList({ title, empty, rows }: { title: string; empty: string; rows: Array<{ id: string; title: string; meta: string }> }) {
  return (
    <div className="rounded-xl border border-line bg-surface-muted p-4">
      <p className="text-sm font-semibold text-text-strong">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg bg-surface p-3">
              <p className="text-sm font-semibold text-text-strong">{row.title}</p>
              <p className="mt-1 text-xs text-text-muted">{row.meta}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const EVENT_TYPE_META: Record<string, { label: string; badge: string; accent: string }> = {
  lawbot_analysis: { label: "AI 분석", badge: "bg-violet-100 text-violet-800", accent: "border-l-violet-400" },
  quote_generated: { label: "견적서", badge: "bg-amber-100 text-amber-800", accent: "border-l-amber-400" },
  case_status_changed: { label: "상태 변경", badge: "bg-sky-100 text-sky-800", accent: "border-l-sky-400" },
  message: { label: "메시지", badge: "bg-emerald-100 text-emerald-800", accent: "border-l-emerald-400" },
  admin: { label: "관리", badge: "bg-surface text-text-muted", accent: "border-l-line" }
};

export function CaseMatterEventTimeline({ events }: { events: CaseMatterDetail["events"] }) {
  return (
    <Card className="p-6">
      <SectionTitle title="사건 이벤트 타임라인" description="payloadJson 원문은 표시하지 않습니다." />
      {events.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface-muted p-3 text-sm text-text-muted">
          등록된 사건 이벤트가 없습니다.
        </p>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => {
            const meta = EVENT_TYPE_META[event.eventType] ?? { label: event.eventType, badge: "bg-surface text-text-muted", accent: "border-line" };
            return (
              <li key={event.id} className={`rounded-xl border-l-4 border border-line bg-surface-muted p-4 ${meta.accent}`}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.badge}`}>
                    {meta.label}
                  </span>
                  <p className="text-xs text-text-muted">{formatDateTime(event.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm text-text">{event.message}</p>
                <p className="mt-1 text-xs text-text-muted">actor: {valueOrDash(event.actorName)}</p>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
