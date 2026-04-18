/*
import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  getSystemHealthSnapshot,
  type HealthLevel,
  type SystemHealthSnapshot
} from "@/lib/services/system-health-service-safe-v2";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const lawTargets = [
  "출입국관리법",
  "출입국관리법 시행령",
  "출입국관리법 시행규칙",
  "국적법",
  "국적법 시행령",
  "행정심판법",
  "행정절차법",
  "민원 처리에 관한 법률",
  "사증 및 체류 기본 기준"
];

const precedentTargets = [
  "강제퇴거 처분 관련 판례",
  "체류자격 변경·연장 관련 판례",
  "행정심판 집행정지 관련 사례",
  "거부·불허 처분 불복 사례",
  "송달 하자 및 불복기간 사례",
  "보완요구·추가서류 제출 관련 사례"
];

function levelBadgeClass(level: HealthLevel) {
  if (level === "ok") return "bg-success/10 text-success";
  if (level === "warn") return "bg-warning/10 text-warning";
  return "bg-danger/10 text-danger";
}

function levelLabel(level: HealthLevel) {
  if (level === "ok") return "정상";
  if (level === "warn") return "주의";
  return "위험";
}

async function safeGetSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  try {
    return await getSystemHealthSnapshot();
  } catch (error) {
    console.error("Failed to load monitoring snapshot", error);
    return {
      generatedAt: new Date().toISOString(),
      overallLevel: "critical",
      score: 0,
      items: [
        {
          key: "snapshot-load",
          title: "시스템 상태 로딩",
          level: "critical",
          summary: "상태 스냅샷을 불러오는 중 오류가 발생했습니다.",
          details: [error instanceof Error ? error.message : String(error)]
        }
      ],
      recommendedActions: ["서버 로그, DB 연결, 환경변수 설정을 우선 확인해 주세요."]
    };
  }
}

export default async function AdminMonitoringPageSafeV4() {
  const snapshot = await safeGetSystemHealthSnapshot();

  return (
    <div className="space-y-6">
      <Card className="ui-analysis-hero p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">System Health</p>
            <h2 className="mt-2 ui-page-title">운영 안정성 모니터링</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              관리자 보안, 공개 접수 보안, 데이터베이스 연결, Lawbot/Notion 연동, 백업 접근 상태를 한 화면에서
              점검할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelBadgeClass(snapshot.overallLevel)}`}>
              상태: {levelLabel(snapshot.overallLevel)}
            </span>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              점수: {snapshot.score} / 100
            </span>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text">
              기준 시각: {formatDateTime(snapshot.generatedAt)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/integrations"
            className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
          >
            연동 센터
          </Link>
          <Link
            href="/admin/inquiries"
            className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
          >
            문의 운영 화면
          </Link>
          <Link
            href="/api/admin/system/health"
            className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
          >
            상태 API 확인
          </Link>
          <Link
            href="/api/inquiries"
            className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
          >
            접수 상태 API
          </Link>
          <Link
            href="/api/admin/system/intake-control"
            className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
          >
            점검 제어 API
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {snapshot.items.map((item) => (
          <Card key={item.key} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="ui-kicker">{item.title}</p>
                <p className="mt-2 text-sm text-text">{item.summary}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelBadgeClass(item.level)}`}>
                {levelLabel(item.level)}
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-text-muted">
              {item.details.map((detail) => (
                <li key={detail}>• {detail}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <p className="ui-kicker">권장 조치</p>
        <h3 className="mt-2 ui-section-title">우선 점검 체크리스트</h3>
        <ul className="mt-4 space-y-2 text-sm text-text-muted">
          {snapshot.recommendedActions.map((action) => (
            <li key={action}>• {action}</li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-text">법령 모니터링 대상</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            {lawTargets.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-text">판례 모니터링 대상</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            {precedentTargets.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
*/

import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  getSystemHealthSnapshot,
  type HealthLevel,
  type SystemHealthSnapshot
} from "@/lib/services/system-health-service-safe-v3";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const lawTargets = [
  "\uCD9C\uC785\uAD6D\uAD00\uB9AC\uBC95",
  "\uCD9C\uC785\uAD6D\uAD00\uB9AC\uBC95 \uC2DC\uD589\uB839",
  "\uCD9C\uC785\uAD6D\uAD00\uB9AC\uBC95 \uC2DC\uD589\uADDC\uCE59",
  "\uAD6D\uC801\uBC95",
  "\uAD6D\uC801\uBC95 \uC2DC\uD589\uB839",
  "\uD589\uC815\uC2EC\uD310\uBC95",
  "\uD589\uC815\uC808\uCC28\uBC95",
  "\uBBFC\uC6D0 \uCC98\uB9AC \uAD00\uB828 \uAE30\uBCF8 \uBC95\uB839",
  "\uC0AC\uC99D/\uCCB4\uB958 \uAE30\uBCF8 \uACE0\uC2DC"
];

const precedentTargets = [
  "\uAC15\uC81C\uD1F4\uAC70 \uCC98\uBD84 \uAD00\uB828 \uD310\uB840",
  "\uCCB4\uB958\uC790\uACA9 \uBCC0\uACBD/\uC5F0\uC7A5 \uAD00\uB828 \uD310\uB840",
  "\uD589\uC815\uC2EC\uD310 \uC9D1\uD589\uC815\uC9C0 \uAD00\uB828 \uC7AC\uACB0\uB840",
  "\uAC70\uBD80/\uBD88\uD5C8 \uCC98\uBD84 \uBD88\uBCF5 \uD310\uB2E8 \uB840",
  "\uC1A1\uB2EC \uD558\uC790 \uBC0F \uBD88\uBCF5\uAE30\uAC04 \uAD00\uB828 \uB840",
  "\uBCF4\uC644\uC694\uAD6C/\uCD94\uAC00\uC11C\uB958 \uC81C\uCD9C \uAD00\uB828 \uB840"
];

function levelBadgeClass(level: HealthLevel) {
  if (level === "ok") return "bg-success/10 text-success";
  if (level === "warn") return "bg-warning/10 text-warning";
  return "bg-danger/10 text-danger";
}

function levelLabel(level: HealthLevel) {
  if (level === "ok") return "\uC815\uC0C1";
  if (level === "warn") return "\uC8FC\uC758";
  return "\uC704\uD5D8";
}

async function safeGetSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  try {
    return await getSystemHealthSnapshot();
  } catch (error) {
    console.error("Failed to load monitoring snapshot", error);
    return {
      generatedAt: new Date().toISOString(),
      overallLevel: "critical",
      score: 0,
      items: [
        {
          key: "snapshot-load",
          title: "\uC2DC\uC2A4\uD15C \uC0C1\uD0DC \uB85C\uB529",
          level: "critical",
          summary: "\uC0C1\uD0DC \uC2A4\uB0C5\uC0F7\uC744 \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.",
          details: [error instanceof Error ? error.message : String(error)]
        }
      ],
      recommendedActions: [
        "\uC11C\uBC84 \uB85C\uADF8, DB \uC5F0\uACB0, \uD658\uACBD\uBCC0\uC218 \uC124\uC815\uC744 \uC6B0\uC120 \uD655\uC778\uD558\uC138\uC694."
      ]
    };
  }
}

export default async function AdminMonitoringPageSafeV4() {
  const snapshot = await safeGetSystemHealthSnapshot();

  return (
    <div className="space-y-6">
      <Card className="ui-analysis-hero p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">System Health</p>
            <h2 className="mt-2 ui-page-title">\uC6B4\uC601 \uC548\uC815\uC131 \uBAA8\uB2C8\uD130\uB9C1</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              \uAD00\uB9AC\uC790 \uBCF4\uC548, \uACF5\uAC1C \uC811\uC218 \uBCF4\uC548, DB \uC5F0\uACB0, Lawbot/Notion \uC5F0\uB3D9,
              \uBC31\uC5C5 \uACBD\uB85C \uC0C1\uD0DC\uB97C \uD55C \uD654\uBA74\uC5D0\uC11C \uD655\uC778\uD569\uB2C8\uB2E4.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelBadgeClass(snapshot.overallLevel)}`}>
              \uC0C1\uD0DC: {levelLabel(snapshot.overallLevel)}
            </span>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              \uC810\uC218: {snapshot.score} / 100
            </span>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text">
              \uAE30\uC900 \uC2DC\uAC01: {formatDateTime(snapshot.generatedAt)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/integrations"
            className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
          >
            \uC5F0\uB3D9 \uC13C\uD130
          </Link>
          <Link
            href="/admin/inquiries"
            className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
          >
            \uBB38\uC758 \uC6B4\uC601 \uD654\uBA74
          </Link>
          <Link
            href="/api/admin/system/health"
            className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
          >
            \uC0C1\uD0DC API \uD655\uC778
          </Link>
          <Link
            href="/api/admin/system/intake-control"
            className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-muted"
          >
            \uC811\uC218 \uC81C\uC5B4 API
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {snapshot.items.map((item) => (
          <Card key={item.key} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="ui-kicker">{item.title}</p>
                <p className="mt-2 text-sm text-text">{item.summary}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelBadgeClass(item.level)}`}>
                {levelLabel(item.level)}
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-text-muted">
              {item.details.map((detail) => (
                <li key={detail}>• {detail}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <p className="ui-kicker">\uAD8C\uC7A5 \uC870\uCE58</p>
        <h3 className="mt-2 ui-section-title">\uC6B0\uC120 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8</h3>
        <ul className="mt-4 space-y-2 text-sm text-text-muted">
          {snapshot.recommendedActions.map((action) => (
            <li key={action}>• {action}</li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-text">\uBC95\uB839 \uBAA8\uB2C8\uD130\uB9C1 \uB300\uC0C1</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            {lawTargets.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-text">\uD310\uB840/\uC7AC\uACB0\uB840 \uBAA8\uB2C8\uD130\uB9C1 \uB300\uC0C1</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            {precedentTargets.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
