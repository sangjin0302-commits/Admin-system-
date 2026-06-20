import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  getSystemHealthSnapshot,
  type HealthLevel,
  type SystemHealthSnapshot
} from "@/lib/services/system-health-service-safe-v3";
import { formatDateTime } from "@/lib/utils";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

const lawTargets = [
  "출입국관리법",
  "출입국관리법 시행령",
  "출입국관리법 시행규칙",
  "국적법",
  "국적법 시행령",
  "행정심판법",
  "행정절차법",
  "민원 처리 관련 기본 법령",
  "사증/체류 기본 고시"
];

const precedentTargets = [
  "강제퇴거 처분 관련 판례",
  "체류자격 변경/연장 관련 판례",
  "행정심판 집행정지 관련 재결례",
  "거부/불허 처분 불복 판단례",
  "송달 하자 및 불복기간 관련 사례",
  "보완요구/추가서류 제출 관련 사례"
];

type MonitoringTone = "success" | "warning" | "danger" | "primary" | "neutral";

const monitoringToneClassMap: Record<MonitoringTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  primary: "bg-primary-soft text-primary",
  neutral: "bg-surface-muted text-text"
};

function levelBadgeClass(level: HealthLevel) {
  if (level === "ok") return monitoringToneClassMap.success;
  if (level === "warn") return monitoringToneClassMap.warning;
  return monitoringToneClassMap.danger;
}

function levelLabel(level: HealthLevel) {
  if (level === "ok") return "정상";
  if (level === "warn") return "주의";
  return "위험";
}

function statusBadgeClassName(tone: MonitoringTone) {
  return `ui-status-pill ${monitoringToneClassMap[tone]}`;
}

async function safeGetSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  try {
    return await getSystemHealthSnapshot();
  } catch (error) {
    logger.error("Failed to load monitoring snapshot", error);
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
      recommendedActions: [
        "서버 로그, DB 연결, 환경변수 설정을 우선 확인해 주세요."
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
            <h2 className="mt-2 ui-page-title">운영 안정성 모니터링</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              관리자 보안, 공개 접수 보안, DB 연결, Lawbot/Notion 연동, 백업 경로 상태를
              한 화면에서 확인합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={statusBadgeClassName(
                snapshot.overallLevel === "ok"
                  ? "success"
                  : snapshot.overallLevel === "warn"
                    ? "warning"
                    : "danger"
              )}
            >
              상태: {levelLabel(snapshot.overallLevel)}
            </span>
            <span className={statusBadgeClassName("primary")}>
              점수: {snapshot.score} / 100
            </span>
            <span className={statusBadgeClassName("neutral")}>
              기준 시각: {formatDateTime(snapshot.generatedAt)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/integrations"
            className="ui-cta-pill-primary"
          >
            연동 센터
          </Link>
          <Link
            href="/admin/inquiries"
            className="ui-cta-pill"
          >
            문의 운영 화면
          </Link>
          <Link
            href="/api/admin/system/health"
            className="ui-cta-pill"
          >
            상태 API 확인
          </Link>
          <Link
            href="/api/admin/system/intake-control"
            className="ui-cta-pill"
          >
            접수 제어 API
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {snapshot.items.map((item) => (
          <Card key={item.key} className="ui-analysis-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="ui-kicker">{item.title}</p>
                <p className="mt-2 text-sm text-text">{item.summary}</p>
              </div>
              <span className={`ui-status-pill ${levelBadgeClass(item.level)}`}>
                {levelLabel(item.level)}
              </span>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text-muted">
              {item.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="ui-analysis-summary p-6">
        <p className="ui-kicker">권장 조치</p>
        <h3 className="mt-2 ui-section-title">우선 체크리스트</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text-muted">
          {snapshot.recommendedActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="ui-analysis-panel p-6">
          <h3 className="text-base font-semibold text-text">법령 모니터링 대상</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text-muted">
            {lawTargets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="ui-analysis-panel p-6">
          <h3 className="text-base font-semibold text-text">판례/재결례 모니터링 대상</h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text-muted">
            {precedentTargets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
