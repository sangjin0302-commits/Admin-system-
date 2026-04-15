import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminSessionBanner } from "@/components/admin/admin-session-banner";
import { IssueBotLinkForm } from "@/components/admin/issue-bot-link-form";
import { InquiryManagementForm } from "@/components/admin/inquiry-management-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireAdminPageSession } from "@/lib/auth/session";
import { deriveInquiryScreening } from "@/lib/intake-screening/service";
import { getInquiryById } from "@/lib/services/inquiry-service";
import { listIssueBotLinks } from "@/lib/services/issue-bot-service";
import { formatDateTime, parseJsonArray } from "@/lib/utils";
import {
  clientTypeLabels,
  inquiryStatusLabels,
  inquiryTypeLabels,
  languageCodeLabels,
  screeningGradeLabels,
  screeningRouteLabels,
  urgencyLabels,
  type ClientType,
  type InquiryType,
  type InquiryStatus,
  type LanguageCode,
  type UrgencyLevel
} from "@/types/inquiry";

export const dynamic = "force-dynamic";

export default async function AdminInquiryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdminPageSession(`/admin/inquiries/${id}`);
  const [inquiry, issueBotLinks] = await Promise.all([getInquiryById(id), listIssueBotLinks(id)]);

  if (!inquiry) {
    notFound();
  }

  const tags = parseJsonArray(inquiry.serviceTags);
  const precheckDocs = parseJsonArray(inquiry.precheckRecommendedDocs).map((entry) => String(entry));
  const inquiryType = inquiry.inquiryType as InquiryType;
  const inquiryStatus = inquiry.status as InquiryStatus;
  const urgencyLevel = inquiry.urgencyLevel as UrgencyLevel;
  const preferredLanguage = inquiry.preferredLanguage as LanguageCode;
  const clientType = inquiry.clientType as ClientType;
  const requestedInquiryType = (inquiry.requestedInquiryType ?? "UNKNOWN") as InquiryType;
  const declaredUrgency = (inquiry.declaredUrgency ?? "MEDIUM") as UrgencyLevel;
  const screening = deriveInquiryScreening({
    id: inquiry.id,
    qualificationScore: inquiry.qualificationScore,
    classificationConfidence: inquiry.classificationConfidence,
    urgencyLevel,
    consultationRequired: inquiry.consultationRequired,
    hasPreparedDocuments: inquiry.hasPreparedDocuments,
    needsTranslation: inquiry.needsTranslation,
    isCorporateRequest: inquiry.isCorporateRequest,
    dueDate: inquiry.dueDate,
    preferredLanguage,
    status: inquiryStatus
  });

  return (
    <div className="space-y-6">
      <AdminSessionBanner session={session} />

      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="status" status={inquiryStatus}>
                {inquiryStatusLabels[inquiryStatus].ko}
              </Badge>
              <Badge tone="urgency" urgency={urgencyLevel}>
                {urgencyLabels[urgencyLevel].ko}
              </Badge>
              <Badge>{inquiryTypeLabels[inquiryType].ko}</Badge>
              <Badge tone="language" language={preferredLanguage}>
                {languageCodeLabels[preferredLanguage].ko}
              </Badge>
            </div>

            <div>
              <p className="ui-kicker">접수 상세</p>
              <h2 className="mt-2 ui-page-title">{inquiry.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-text">{inquiry.generatedSummary}</p>
            </div>

            <div className="grid gap-3 text-sm text-text-muted sm:grid-cols-2 xl:grid-cols-3">
              <p>접수번호: {inquiry.id}</p>
              <p>접수일: {formatDateTime(inquiry.createdAt)}</p>
              <p>최종 수정: {formatDateTime(inquiry.updatedAt)}</p>
              <p>담당 연락처: {inquiry.contactName}</p>
              <p>이메일: {inquiry.email}</p>
              <p>전화번호: {inquiry.phone || "-"}</p>
              <p>고객 구분: {clientTypeLabels[clientType].ko}</p>
              <p>기업 의뢰: {inquiry.isCorporateRequest ? "예" : "아니오"}</p>
              <p>담당자: {inquiry.assignee || "-"}</p>
            </div>
          </div>

          <div className="w-full max-w-md">
            <Card muted className="p-5">
              <InquiryManagementForm
                inquiryId={inquiry.id}
                status={inquiry.status}
                assignee={inquiry.assignee}
                internalMemo={inquiry.internalMemo}
              />
            </Card>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <h3 className="ui-section-title">접수 요약</h3>
          <div className="mt-5 grid gap-4 text-sm text-text sm:grid-cols-2">
            <InfoItem label="국적" value={inquiry.nationality} />
            <InfoItem label="현재 체류/상태" value={inquiry.currentStatus} />
            <InfoItem label="서류 발급 국가" value={inquiry.documentCountry} />
            <InfoItem label="대상 기관" value={inquiry.targetAgency} />
            <InfoItem
              label="희망 분야"
              value={inquiryTypeLabels[requestedInquiryType].ko}
            />
            <InfoItem
              label="신청 긴급도"
              value={urgencyLabels[declaredUrgency].ko}
            />
            <InfoItem label="희망 기한" value={formatDateTime(inquiry.dueDate)} />
            <InfoItem label="준비된 서류" value={inquiry.hasPreparedDocuments ? "예" : "아니오"} />
            <InfoItem label="번역 필요" value={inquiry.needsTranslation ? "예" : "아니오"} />
            <InfoItem label="전화 회신 요청" value={inquiry.wantsCallback ? "예" : "아니오"} />
          </div>

          <Card muted className="mt-6 p-5">
            <p className="ui-kicker">원문 접수 내용</p>
            <p className="mt-3 whitespace-pre-line text-sm text-text">{inquiry.description}</p>
          </Card>

          <Card muted className="mt-4 p-5">
            <p className="ui-kicker">희망 결과</p>
            <p className="mt-3 whitespace-pre-line text-sm text-text">
              {inquiry.requestedOutcome || "-"}
            </p>
          </Card>
        </Card>

        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="ui-section-title">사전 검토 요약</h3>
              <p className="ui-section-copy mt-2">
                AI 분류와 기존 선별 점수를 합쳐 상담 우선순위와 다음 운영 경로를 제안합니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                {screeningGradeLabels[screening.grade].ko}
              </Badge>
              <Badge>{screeningRouteLabels[screening.route].ko}</Badge>
            </div>
          </div>

          <Card muted className="mt-5 p-5">
            <p className="ui-kicker">선별 결과</p>
            <p className="mt-3 text-sm font-semibold text-text-strong">{screening.headline}</p>
            <p className="mt-2 text-sm leading-6 text-text">{screening.summary}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={screening.actionHref} className="ui-toolbar-button px-4 py-2 text-sm">
                {screening.actionLabel}
              </Link>
              <Link href={`/admin/inquiries/${inquiry.id}/quote`} className="ui-toolbar-button px-4 py-2 text-sm">
                견적 / 제안서 검토
              </Link>
            </div>
          </Card>

          <div className="mt-5 grid gap-3">
            <InfoItem label="문의 유형" value={inquiryTypeLabels[inquiryType].ko} />
            <InfoItem label="긴급도" value={urgencyLabels[urgencyLevel].ko} />
            <InfoItem
              label="Consultation"
              value={inquiry.consultationRequired ? "Required" : "Guidance first"}
            />
            <InfoItem
              label="분류 신뢰도"
              value={`${Math.round(inquiry.classificationConfidence * 100)}%`}
            />
            <InfoItem label="적합도" value={`${inquiry.qualificationScore} / 100`} />
          </div>

          <Card muted className="mt-5 p-5">
            <p className="ui-kicker">분류 사유</p>
            <p className="mt-3 text-sm text-text">{inquiry.classificationReason}</p>
          </Card>

          <Card muted className="mt-5 p-5">
            <p className="ui-kicker">권장 다음 단계</p>
            <p className="mt-3 text-sm text-text">{inquiry.recommendedNextStep}</p>
          </Card>

          <Card muted className="mt-5 p-5">
            <p className="ui-kicker">추천 서류</p>
            <ul className="mt-3 list-decimal space-y-1 pl-5 text-sm text-text">
              {precheckDocs.length > 0 ? (
                precheckDocs.map((doc) => <li key={doc}>{doc}</li>)
              ) : (
                <li>생성된 추천 서류 목록이 없습니다.</li>
              )}
            </ul>
          </Card>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="ui-kicker">업무 바로가기</p>
            <h3 className="mt-2 ui-section-title">견적, 사건, 고객관리를 전용 화면으로 분리했습니다</h3>
            <p className="ui-section-copy mt-2">
              이 접수 요약 화면에서는 핵심 정보만 보고, 실제 업무 처리는 전용 하위 화면에서 진행합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <RouteLink href={`/admin/inquiries/${inquiry.id}/quote`} label="제안서 / 견적" />
            <RouteLink href={`/admin/inquiries/${inquiry.id}/case`} label="사건 / 제출 관리" />
            <RouteLink
              href={`/admin/inquiries/${inquiry.id}/relationship`}
              label="고객관리 / 후속조치"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <IssueBotLinkForm inquiryId={inquiry.id} links={issueBotLinks} />
      </Card>
    </div>
  );
}

function RouteLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="ui-toolbar-button px-4 py-2 text-sm"
    >
      {label}
    </Link>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <Card muted className="p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-sm text-text">{value || "-"}</p>
    </Card>
  );
}

