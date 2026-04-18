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
      label: "\uC2E4\uC5F0\uACB0 \uAC00\uB2A5",
      toneClassName: "bg-success/10 text-success"
    };
  }

  if (hasAnalyzeUrl) {
    return {
      label: "\uC8FC\uC18C\uB9CC \uC5F0\uACB0",
      toneClassName: "bg-warning/10 text-warning"
    };
  }

  return {
    label: "\uBBF8\uC5F0\uACB0",
    toneClassName: "bg-danger/10 text-danger"
  };
}

const ossUpgradeCandidates = [
  {
    key: "twenty",
    name: "twentyhq/twenty",
    href: "https://github.com/twentyhq/twenty",
    priority: "\uC6B0\uC120 \uB3C4\uC785",
    summary:
      "CRM \uD30C\uC774\uD504\uB77C\uC778/\uACE0\uAC1D \uD0C0\uC784\uB77C\uC778 \uAD6C\uC870\uAC00 \uC798 \uC815\uB9AC\uB41C \uB808\uD37C\uB7F0\uC2A4\uB85C, \uBB38\uC758-\uC0C1\uB2F4-\uACAC\uC801-\uC218\uC784 \uD750\uB984 \uACE0\uB3C4\uD654\uC5D0 \uC801\uD569\uD569\uB2C8\uB2E4."
  },
  {
    key: "plane",
    name: "makeplane/plane",
    href: "https://github.com/makeplane/plane",
    priority: "\uC911\uAE30 \uB3C4\uC785",
    summary:
      "\uBCF4\uB4DC/\uC2A4\uD504\uB9B0\uD2B8 \uC911\uC2EC \uC5C5\uBB34 \uAD00\uB9AC \uD328\uD134\uC744 \uCC38\uACE0\uD558\uAE30 \uC88B\uC544 \uC0AC\uAC74 \uC9C4\uD589 \uBCF4\uB4DC\uC640 \uB2F4\uB2F9 \uD050 \uD655\uC7A5\uC5D0 \uC720\uB9AC\uD569\uB2C8\uB2E4."
  },
  {
    key: "refine",
    name: "refinedev/refine",
    href: "https://github.com/refinedev/refine",
    priority: "\uC989\uC2DC \uCC38\uACE0",
    summary:
      "\uAD00\uB9AC\uC790 \uD654\uBA74\uC758 CRUD, \uD544\uD130, \uB370\uC774\uD130 \uD14C\uC774\uBE14 \uD328\uD134\uC774 \uC131\uC219\uD574 \uC815\uBCF4 \uC9D1\uC57D/\uC0C1\uC138 \uD3B8\uC9D1 UX \uAC1C\uC120\uC5D0 \uB3C4\uC6C0\uC774 \uB429\uB2C8\uB2E4."
  },
  {
    key: "n8n",
    name: "n8n-io/n8n",
    href: "https://github.com/n8n-io/n8n",
    priority: "\uC120\uD0DD \uB3C4\uC785",
    summary:
      "\uBB38\uC758 \uC811\uC218 \uC54C\uB9BC, \uBC31\uC5C5, \uB178\uC158 \uB3D9\uAE30\uD654 \uAC19\uC740 \uC6CC\uD06C\uD50C\uB85C \uC790\uB3D9\uD654\uC5D0 \uAC15\uC810\uC774 \uC788\uC73C\uBA70 \uBC84\uC804/\uBCF4\uC548 \uD328\uCE58 \uC6B4\uC601 \uCCB4\uACC4\uB97C \uD568\uAED8 \uAC00\uC838\uAC00\uC57C \uD569\uB2C8\uB2E4."
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
      className: "bg-success/10 text-success"
    };
  }

  return {
    label: "연결 준비",
    className: "bg-info/10 text-info"
  };
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
        <p className="ui-kicker">\uC5F0\uB3D9 \uC13C\uD130</p>
        <h2 className="mt-2 ui-page-title">Lawbot / Market Analyze \uD1B5\uD569 \uD654\uBA74</h2>
        <p className="mt-2 max-w-3xl text-sm text-text-muted">
          \uD604\uC7AC system\uC5D0\uC11C\uB294 Lawbot\uACFC Market Analyze\uB97C \uC9C1\uC811 \uD558\uB098\uB85C \uBB36\uC5B4 \uC6B4\uC601\uD558\uB294
          \uB2E8\uACC4\uB294 \uC544\uB2C8\uACE0, \uAC01\uAC01\uC758 \uBD84\uC11D \uACB0\uACFC\uB97C system \uC5C5\uBB34 \uD750\uB984\uC5D0 \uD761\uC218\uD558\uB294
          \uAD6C\uC870\uB85C \uAC00\uACE0 \uC788\uC2B5\uB2C8\uB2E4.
        </p>
      </Card>

      <PublicIntakeControlCard
        initialSnapshot={publicIntakeControl}
        initialHistory={publicIntakeHistory}
        initialCapabilities={publicIntakeCapabilities}
      />

      <Card className="p-6">
        <p className="ui-kicker">GitHub Pattern Adoption</p>
        <h3 className="mt-2 ui-section-title">참고 레포 반영 현황</h3>
        <p className="mt-2 text-sm text-text-muted">
          외부 GitHub 레퍼런스에서 가져온 운영 패턴 중 현재 system에 반영된 항목을 표시합니다.
        </p>
        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          {githubPatternAdoption.map((item) => {
            const tone = getAdoptionTone(item.status);
            return (
              <Card key={item.key} muted className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text-strong">{item.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.className}`}>{tone.label}</span>
                </div>
                <p className="mt-2 text-sm text-text-muted">{item.detail}</p>
              </Card>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ui-kicker">Lawbot</p>
              <h3 className="mt-2 ui-section-title">\uBC95\uB960 \uBD84\uC11D \uC5D4\uC9C4</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lawbotStatus.toneClassName}`}>
              {lawbotStatus.label}
            </span>
          </div>
          <div className="mt-4 space-y-3 text-sm text-text-muted">
            <p>\u2022 \uC2E4\uC81C API \uD638\uCD9C \uCF54\uB4DC\uB294 system \uC548\uC5D0 \uC774\uBBF8 \uB4E4\uC5B4\uC788\uC2B5\uB2C8\uB2E4.</p>
            <p>\u2022 \uC0AC\uAC74 \uC0C1\uC138\uC5D0\uC11C \uC2A4\uB0C5\uC0F7 \uC800\uC7A5, \uC7AC\uBD84\uC11D, fallback \uD45C\uC2DC \uAD6C\uC870\uAE4C\uC9C0 \uC900\uBE44\uB410\uC2B5\uB2C8\uB2E4.</p>
            <p>\u2022 \uB2E4\uC74C \uB2E8\uACC4\uB294 \uC2E4\uC81C \uC11C\uBC84 \uC548\uC815\uD654\uC640 \uACB0\uACFC \uD488\uC9C8 \uD655\uC778\uC785\uB2C8\uB2E4.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/admin/inquiries"
              className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              \uC0AC\uAC74 \uC0C1\uC138\uC5D0\uC11C \uD655\uC778
            </Link>
            <Link
              href="/admin/monitoring"
              className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
            >
              \uBC95\uB839 \uBAA8\uB2C8\uD130\uB9C1
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <p className="ui-kicker">Market Analyze</p>
          <h3 className="mt-2 ui-section-title">\uC2DC\uC7A5 \uC778\uC0AC\uC774\uD2B8 \uC6CC\uD06C\uC2A4\uD398\uC774\uC2A4</h3>
          <div className="mt-4 space-y-3 text-sm text-text-muted">
            <p>\u2022 \uBCC4\uB3C4 frontend \uAD6C\uC131\uC740 \uD655\uC778\uB41C \uC0C1\uD0DC\uC785\uB2C8\uB2E4.</p>
            <p>\u2022 \uD655\uC778\uB41C \uD654\uBA74: dashboard, competitors, hot issues, sentiment, services</p>
            <p>\u2022 \uC9C0\uAE08 system \uC548\uC5D0\uC11C\uB294 \uC2E4\uC2DC\uAC04 \uB0B4\uC7A5 \uD655\uC7A5\uBCF4\uB2E4, \uC6CC\uD06C\uC2A4\uD398\uC774\uC2A4 \uC790\uB9AC\uB97C \uBA3C\uC800 \uBCF4\uC5EC\uC8FC\uB294 \uB2E8\uACC4\uC785\uB2C8\uB2E4.</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "\uB300\uC2DC\uBCF4\uB4DC",
              "\uACBD\uC7C1\uC0AC",
              "\uD56B\uC774\uC288",
              "\uAC10\uC131 \uBD84\uC11D",
              "\uC11C\uBE44\uC2A4 \uBD84\uC11D"
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-line bg-surface-muted px-4 py-4 text-sm text-text-strong">
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="ui-kicker">\uCD94\uCC9C \uB808\uD37C\uB7F0\uC2A4</p>
        <h3 className="mt-2 ui-section-title">\uBAA9\uC801 \uB9DE\uCDA4 \uC624\uD508\uC18C\uC2A4 \uB3C4\uC785 \uB85C\uB4DC\uB9F5</h3>
        <p className="mt-3 text-sm text-text-muted">
          \uC9C0\uAE08 system \uAD6C\uC870\uB97C \uAE68\uC9C0 \uC54A\uACE0 \uC5C5\uADF8\uB808\uC774\uB4DC\uD560 \uC218 \uC788\uB294 \uC2E4\uC804 \uCC38\uACE0 \uB808\uD3EC \uBAA9\uB85D\uC785\uB2C8\uB2E4.
          \uD654\uBA74 \uD328\uD134\uC740 \uCC38\uACE0\uD558\uB418, \uB370\uC774\uD130 \uC6D0\uBCF8\uC740 \uD604\uC7AC system DB \uAE30\uC900\uC73C\uB85C \uC720\uC9C0\uD558\uB294 \uBC29\uD5A5\uC744 \uAD8C\uC7A5\uD569\uB2C8\uB2E4.
        </p>
        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {ossUpgradeCandidates.map((repo) => (
            <Card key={repo.key} muted className="p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text-strong">{repo.name}</p>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  {repo.priority}
                </span>
              </div>
              <p className="mt-2 text-sm text-text-muted">{repo.summary}</p>
              <a
                href={repo.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-medium text-primary"
              >
                GitHub \uBC14\uB85C\uAC00\uAE30
              </a>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <p className="ui-kicker">\uC5F0\uACB0 \uBC29\uC2DD</p>
        <h3 className="mt-2 ui-section-title">\uC9C0\uAE08 \uB2F9\uC7A5 \uAC00\uB2A5\uD55C \uBC29\uD5A5</h3>
        <div className="mt-4 space-y-3 text-sm text-text-muted">
          <p>\u2022 GitHub \uC800\uC7A5\uC18C\uB97C system\uC774 \uB7F0\uD0C0\uC784\uC5D0 \uC9C1\uC811 \uC77D\uC5B4\uC624\uB294 \uAD6C\uC870\uB294 \uC544\uB2D9\uB2C8\uB2E4.</p>
          <p>\u2022 \uC2E4\uC81C \uC5F0\uB3D9\uC740 \uBCF4\uD1B5 API \uC8FC\uC18C, \uBC30\uD3EC URL, \uB610\uB294 \uAC19\uC740 \uBAA8\uB178\uB808\uD3EC/\uC11C\uBE0C\uBAA8\uB4C8 \uBC29\uC2DD\uC73C\uB85C \uD574\uC57C \uD569\uB2C8\uB2E4.</p>
          <p>\u2022 \uADF8\uB798\uC11C \uC9C0\uAE08\uC740 system \uC548\uC5D0 \uD654\uBA74 \uC790\uB9AC\uB97C \uB9CC\uB4E4\uACE0, \uB098\uC911\uC5D0 \uC2E4\uC81C URL/API\uB97C \uAF42\uB294 \uAC83\uC774 \uAC00\uC7A5 \uC548\uC804\uD55C \uC21C\uC11C\uC785\uB2C8\uB2E4.</p>
        </div>
      </Card>
    </div>
  );
}

