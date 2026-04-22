import Link from "next/link";

import { PublicIntakeControlCard } from "@/components/admin/public-intake-control-card";
import { Card } from "@/components/ui/card";
import {
  getPublicIntakeControlCapabilities,
  getPublicIntakeControlSnapshot,
  listPublicIntakeControlHistory
} from "@/lib/services/public-intake-control-service-safe-v3";

export const dynamic = "force-dynamic";

function getLawbotStatus() {
  const hasAnalyzeUrl = Boolean(process.env.LAWBOT_ANALYZE_URL?.trim());
  const hasAnalyzeToken = Boolean(process.env.LAWBOT_ANALYZE_TOKEN?.trim());

  if (hasAnalyzeUrl && hasAnalyzeToken) {
    return {
      label: "실연결 가능",
      tone: "success" as const
    };
  }

  if (hasAnalyzeUrl) {
    return {
      label: "주소만 연결",
      tone: "warning" as const
    };
  }

  return {
    label: "미연결",
    tone: "danger" as const
  };
}

const ossUpgradeCandidates = [
  {
    key: "twenty",
    name: "twentyhq/twenty",
    href: "https://github.com/twentyhq/twenty",
    priority: "우선 도입",
    summary:
      "CRM 파이프라인/고객 타임라인 구조가 잘 정리된 레퍼런스로, 문의-상담-견적-수임 흐름 고도화에 적합합니다."
  },
  {
    key: "plane",
    name: "makeplane/plane",
    href: "https://github.com/makeplane/plane",
    priority: "중기 도입",
    summary:
      "보드/스프린트 중심 업무 관리 패턴을 참고하기 좋아 사건 진행 보드와 담당 큐 확장에 유리합니다."
  },
  {
    key: "refine",
    name: "refinedev/refine",
    href: "https://github.com/refinedev/refine",
    priority: "즉시 참고",
    summary:
      "관리자 화면의 CRUD, 필터, 데이터 테이블 패턴이 성숙해 정보 집약/상세 편집 UX 개선에 도움이 됩니다."
  },
  {
    key: "n8n",
    name: "n8n-io/n8n",
    href: "https://github.com/n8n-io/n8n",
    priority: "선택 도입",
    summary:
      "문의 접수 알림, 백업, 노션 동기화 같은 워크플로 자동화에 강점이 있으며 버전/보안 패치 운영 체계를 함께 가져가야 합니다."
  }
] as const;

const githubPatternAdoption = [
  {
    key: "pipeline-board",
    title: "GitHub Projects형 파이프라인 보드",
    status: "applied",
    detail: "/admin/inquiries 에 보드 뷰와 목록 뷰 전환을 추가했습니다."
  },
  {
    key: "preset-filters",
    title: "라벨형 빠른 필터 프리셋",
    status: "applied",
    detail: "긴급, 상담, 견적, 검토, 비자, 언어 기준 프리셋을 바로 적용할 수 있습니다."
  },
  {
    key: "status-group-filter",
    title: "상태 그룹 필터(상담/견적/검토)",
    status: "applied",
    detail: "단일 상태가 아니라 업무 흐름 단위로 한 번에 필터링할 수 있습니다."
  },
  {
    key: "runtime-bridge",
    title: "Lawbot/Market Analyze 런타임 브리지",
    status: "ready",
    detail: "UI/저장 구조는 준비되었고, 실제 API URL/토큰 연결만 남아 있습니다."
  }
] as const;

function getAdoptionTone(status: "applied" | "ready") {
  if (status === "applied") {
    return {
      label: "적용 완료",
      tone: "success" as const
    };
  }

  return {
    label: "연결 준비",
    tone: "info" as const
  };
}

type IntegrationTone = "success" | "warning" | "danger" | "info" | "primary";

const integrationToneClassMap: Record<IntegrationTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-primary-soft text-primary",
  primary: "bg-primary-soft text-primary"
};

const secondaryActionClassName =
  "ui-cta-pill";

const primaryActionClassName =
  "ui-cta-pill-primary";

function statusBadgeClassName(tone: IntegrationTone) {
  return `ui-status-pill ${integrationToneClassMap[tone]}`;
}

export default async function AdminIntegrationsPage() {
  const lawbotStatus = getLawbotStatus();
  const [publicIntakeControl, publicIntakeHistory, publicIntakeCapabilities] = await Promise.all([
    getPublicIntakeControlSnapshot(),
    listPublicIntakeControlHistory(20),
    Promise.resolve(getPublicIntakeControlCapabilities())
  ]);

  return (
    <div className="space-y-6">
      <Card className="ui-analysis-hero p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="ui-kicker">연동 센터</p>
            <h2 className="mt-2 ui-page-title">Lawbot / Market Analyze 통합 화면</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              현재 system에서는 Lawbot과 Market Analyze를 직접 하나로 묶어 운영하는
              단계는 아니고, 각각의 분석 결과를 system 업무 흐름에 흡수하는
              구조로 가고 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={statusBadgeClassName(lawbotStatus.tone)}>Lawbot {lawbotStatus.label}</span>
            <span className={statusBadgeClassName("info")}>Market Analyze 워크스페이스 준비</span>
            <span className={statusBadgeClassName("primary")}>운영 흐름 우선 유지</span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/admin/inquiries" className={primaryActionClassName}>
            사건 상세에서 확인
          </Link>
          <Link href="/admin/monitoring" className={secondaryActionClassName}>
            법령 모니터링
          </Link>
        </div>
      </Card>

      <PublicIntakeControlCard
        initialSnapshot={publicIntakeControl}
        initialHistory={publicIntakeHistory}
        initialCapabilities={publicIntakeCapabilities}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <p className="ui-kicker">GitHub Pattern Adoption</p>
          <h3 className="mt-2 ui-section-title">참고 레포 반영 현황</h3>
          <p className="mt-2 text-sm text-text-muted">
            외부 GitHub 레퍼런스에서 가져온 운영 패턴 중 현재 system에 반영된 항목을 표시합니다.
          </p>
          <div className="mt-4 grid gap-3">
            {githubPatternAdoption.map((item) => {
              const tone = getAdoptionTone(item.status);
              return (
                <Card key={item.key} muted className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text-strong">{item.title}</p>
                    <span className={statusBadgeClassName(tone.tone)}>{tone.label}</span>
                  </div>
                  <p className="mt-2 text-sm text-text-muted">{item.detail}</p>
                </Card>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <p className="ui-kicker">연결 방식</p>
          <h3 className="mt-2 ui-section-title">지금 당장 가능한 방향</h3>
          <div className="mt-4 space-y-3 text-sm text-text-muted">
            <p>• GitHub 저장소를 system이 런타임에 직접 읽어오는 구조는 아닙니다.</p>
            <p>• 실제 연동은 보통 API 주소, 배포 URL, 또는 같은 모노레포/서브모듈 방식으로 해야 합니다.</p>
            <p>• 그래서 지금은 system 안에 화면 자리를 만들고, 나중에 실제 URL/API를 꽂는 것이 가장 안전한 순서입니다.</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="ui-analysis-panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ui-kicker">Lawbot</p>
              <h3 className="mt-2 ui-section-title">법률 분석 엔진</h3>
            </div>
            <span className={statusBadgeClassName(lawbotStatus.tone)}>{lawbotStatus.label}</span>
          </div>
          <div className="mt-4 space-y-3 text-sm text-text-muted">
            <p>• 실제 API 호출 코드는 system 안에 이미 들어있습니다.</p>
            <p>• 사건 상세에서 스냅샷 저장, 재분석, fallback 표시 구조까지 준비됐습니다.</p>
            <p>• 다음 단계는 실제 서버 안정화와 결과 품질 확인입니다.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/admin/inquiries" className={secondaryActionClassName}>
              사건 상세에서 확인
            </Link>
            <Link href="/admin/monitoring" className={secondaryActionClassName}>
              법령 모니터링
            </Link>
          </div>
        </Card>

        <Card className="ui-analysis-panel p-6">
          <p className="ui-kicker">Market Analyze</p>
          <h3 className="mt-2 ui-section-title">시장 인사이트 워크스페이스</h3>
          <div className="mt-4 space-y-3 text-sm text-text-muted">
            <p>• 별도 frontend 구성은 확인된 상태입니다.</p>
            <p>• 확인된 화면: dashboard, competitors, hot issues, sentiment, services</p>
            <p>• 지금 system 안에서는 실시간 내장 확장보다, 워크스페이스 자리를 먼저 보여주는 단계입니다.</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "대시보드",
              "경쟁사",
              "핫이슈",
              "감성 분석",
              "서비스 분석"
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-line bg-surface-muted px-4 py-4 text-sm font-medium text-text-strong"
              >
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="ui-kicker">추천 레퍼런스</p>
        <h3 className="mt-2 ui-section-title">목적 맞춤 오픈소스 도입 로드맵</h3>
        <p className="mt-3 text-sm text-text-muted">
          지금 system 구조를 깨지 않고 업그레이드할 수 있는 실전 참고 레포 목록입니다.
          화면 패턴은 참고하되, 데이터 원본은 현재 system DB 기준으로 유지하는 방향을 권장합니다.
        </p>
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {ossUpgradeCandidates.map((repo) => (
            <Card key={repo.key} muted className="p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text-strong">{repo.name}</p>
                <span className={statusBadgeClassName("primary")}>{repo.priority}</span>
              </div>
              <p className="mt-2 text-sm text-text-muted">{repo.summary}</p>
              <a
                href={repo.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                GitHub 바로가기
              </a>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
