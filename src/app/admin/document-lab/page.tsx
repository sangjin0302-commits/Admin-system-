import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  getDocumentTemplateCategoryLabel,
  getDocumentTemplateConversionStatusLabel,
  getDocumentTemplateRiskLabel,
  listDocumentTemplateInventory,
  type DocumentTemplateInventoryItem,
  type DocumentTemplateRiskLevel
} from "@/lib/document-templates";

export const dynamic = "force-dynamic";

const riskClassName = {
  low: "border-blue-200 bg-blue-50 text-blue-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-red-200 bg-red-50 text-red-700"
} satisfies Record<DocumentTemplateRiskLevel, string>;

function formatDate(value: string | null) {
  return value ?? "미확인";
}

function formatCanonicalFormats(item: DocumentTemplateInventoryItem) {
  return item.canonicalFormatCandidate.map((format) => format.toUpperCase()).join(", ");
}

export default function AdminDocumentLabPage() {
  const templates = listDocumentTemplateInventory();
  const highRiskCount = templates.filter((template) => template.riskLevel === "high").length;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Admin-only document lab</p>
            <h2 className="mt-2 ui-page-title">문서 실험실</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              HWP/HWPX 공공서식 자동완성 파이프라인을 검증하기 위한 관리자 전용 실험 공간입니다.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
          >
            관리자 대시보드
          </Link>
        </div>
      </Card>

      <Card className="border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-900">현재는 read-only inventory 단계입니다.</p>
        <p className="mt-2 text-sm text-amber-900">
          문서 생성 없음, 다운로드 없음, 파일 업로드 없음, CaseMatter 연결 없음, 고객 발송 없음, 기관 제출 없음, AI 단독
          법률판단 없음. 공식 서식 최신성 확인 필요.
        </p>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">Inventory</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{templates.length}</p>
          <p className="mt-1 text-xs text-text-muted">등록된 후보 서식</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">HWP/HWPX</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">
            {templates.filter((template) => template.canonicalFormatCandidate.some((format) => format === "hwpx")).length}
          </p>
          <p className="mt-1 text-xs text-text-muted">HWPX 후보</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">High risk</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{highRiskCount}</p>
          <p className="mt-1 text-xs text-text-muted">관리자 검토 필요</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">Status</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">0</p>
          <p className="mt-1 text-xs text-text-muted">검증 완료 서식</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Pipeline overview</p>
            <h3 className="mt-2 ui-section-title">HWP/HWPX 공공서식 파이프라인</h3>
            <p className="mt-2 text-sm text-text-muted">
              HWP 원본은 source asset으로 추적하고, 검증된 HWPX/DOCX/HTML만 runtime template 후보로 올립니다.
            </p>
          </div>
          <Link href="/admin/ledger" className="text-sm font-medium text-primary">
            운영 데이터는 아직 연결하지 않음
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ["1", "원본 확보", "공식 HWP 원본과 출처를 확인합니다."],
            ["2", "변환 검증", "HWPX/DOCX/HTML 후보의 표, 줄바꿈, 입력란을 비교합니다."],
            ["3", "관리자 미리보기", "샘플 데이터로 누락 필드와 레이아웃을 확인합니다."],
            ["4", "후속 연결", "검증 후 CaseMatter read-only 연결을 별도 PR로 다룹니다."]
          ].map(([step, title, description]) => (
            <Card key={step} muted className="p-4">
              <p className="text-xs font-semibold text-text-muted">Phase {step}</p>
              <h4 className="mt-2 text-sm font-semibold text-text-strong">{title}</h4>
              <p className="mt-2 text-xs text-text-muted">{description}</p>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-2">
          <p className="ui-kicker">Template inventory</p>
          <h3 className="ui-section-title">read-only inventory</h3>
          <p className="text-sm text-text-muted">
            실제 파일 path나 고객 데이터 없이 후보 서식의 상태만 표시합니다.
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                <th className="px-3 py-3">서식</th>
                <th className="px-3 py-3">분류</th>
                <th className="px-3 py-3">원본</th>
                <th className="px-3 py-3">후보 포맷</th>
                <th className="px-3 py-3">변환 상태</th>
                <th className="px-3 py-3">위험도</th>
                <th className="px-3 py-3">필수값</th>
                <th className="px-3 py-3">공식 출처</th>
                <th className="px-3 py-3">확인일</th>
                <th className="px-3 py-3">메모</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {templates.map((template) => (
                <tr key={template.id} className="align-top">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-text-strong">{template.titleKo}</p>
                    <p className="mt-1 text-xs text-text-muted">{template.id}</p>
                  </td>
                  <td className="px-3 py-3 text-text-muted">
                    {getDocumentTemplateCategoryLabel(template.category)}
                  </td>
                  <td className="px-3 py-3 text-text-muted">{template.sourceFormat.toUpperCase()}</td>
                  <td className="px-3 py-3 text-text-muted">{formatCanonicalFormats(template)}</td>
                  <td className="px-3 py-3 text-text-muted">
                    {getDocumentTemplateConversionStatusLabel(template.conversionStatus)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${riskClassName[template.riskLevel]}`}
                    >
                      {getDocumentTemplateRiskLabel(template.riskLevel)}
                    </span>
                    {template.riskLevel === "high" ? (
                      <p className="mt-1 text-xs text-text-muted">admin review 필요</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-text-muted">{template.requiredFields.length}개</td>
                  <td className="px-3 py-3 text-text-muted">{template.officialSourceName}</td>
                  <td className="px-3 py-3 text-text-muted">{formatDate(template.latestVerifiedAt)}</td>
                  <td className="max-w-xs px-3 py-3 text-text-muted">{template.notesKo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <p className="ui-kicker">Safety guardrails</p>
          <h3 className="mt-2 ui-section-title">안전 기준</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            <li>관리자 전용 화면입니다.</li>
            <li>read-only inventory만 표시합니다.</li>
            <li>공식 서식 최신성 확인 필요.</li>
            <li>고위험 문서는 업무범위와 공식 서식 확인 후 별도 단계에서 다룹니다.</li>
            <li>고객 발송 없음, 기관 제출 없음, AI 단독 법률판단 없음.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <p className="ui-kicker">Next steps</p>
          <h3 className="mt-2 ui-section-title">다음 단계 후보</h3>
          <ol className="mt-4 space-y-2 text-sm text-text-muted">
            <li>1. 공식 HWP 원본 확보 상태를 별도 checklist로 관리.</li>
            <li>2. 샘플 데이터 기반 HWPX/DOCX/HTML 변환 실험.</li>
            <li>3. preview-only placeholder renderer 설계.</li>
            <li>4. 검증 후 CaseMatter read-only 연결 검토.</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
