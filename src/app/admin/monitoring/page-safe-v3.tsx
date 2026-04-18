export { default } from "./page-safe-v4";
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
  "재한외국인 처우 기본법"
];

const precedentTargets = [
  "강제퇴거 처분 관련 판례",
  "체류자격 변경/연장 관련 판례",
  "행정심판 집행정지 사례",
  "거부·불허 처분 취소 사례",
  "송달 하자 및 불복기간 사례",
  "보완요구/추가서류 제출 관련 사례"
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
          title: "헬스 스냅샷 로딩",
          level: "critical",
          summary: "헬스 스냅샷을 불러오는 중 오류가 발생했습니다.",
          details: [error instanceof Error ? error.message : String(error)]
        }
      ],
      recommendedActions: [
        "서버 로그에서 error digest를 확인하고 DATABASE_URL 및 ENV 설정을 점검하세요."
      ]
    };
  }
}

export default async function AdminMonitoringPageSafeV3() {
  const snapshot = await safeGetSystemHealthSnapshot();

  return (
    <div className="space-y-6">
      <Card className="ui-analysis-hero p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">System Health</p>
            <h2 className="mt-2 ui-page-title">운영 안정성 모니터링</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              관리자 보안, DB 연결, Lawbot/Notion 연동, 스토리지 접근 상태를 한 화면에서 확인합니다.
              점수는 현재 상태를 빠르게 파악하기 위한 참고값이며, 상세 원인은 아래 카드에서 확인할 수 있습니다.
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
            헬스 API 확인
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
        <h3 className="mt-2 ui-section-title">운영 안정성 체크리스트</h3>
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
          <div className="mt-5 rounded-2xl bg-surface-muted p-4 text-sm text-text-muted">
            <p className="font-medium text-text">Lawbot 명령 예시</p>
            <p className="mt-2">• 전체 조회: <code>/lawmonitor</code></p>
            <p>• 전체 저장: <code>/lawmonitor run</code></p>
            <p>• 개별 조회: <code>/lawmonitor 국적법</code></p>
            <p>• 개별 저장: <code>/lawsave 국적법</code></p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-text">판례 모니터링 대상</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            {precedentTargets.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl bg-surface-muted p-4 text-sm text-text-muted">
            <p className="font-medium text-text">Lawbot 명령 예시</p>
            <p className="mt-2">• 전체 조회: <code>/precmonitor</code></p>
            <p>• 전체 저장: <code>/precmonitor run</code></p>
            <p>• 개별 조회: <code>/precmonitor 강제퇴거</code></p>
            <p>• 개별 저장: <code>/precsave 강제퇴거</code></p>
          </div>
        </Card>
      </div>
    </div>
  );
}
*/
