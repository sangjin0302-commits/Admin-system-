import Link from "next/link";

import { Card } from "@/components/ui/card";

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

export default function AdminIntegrationsPage() {
  const lawbotStatus = getLawbotStatus();

  return (
    <div className="space-y-6">
      <Card className="ui-analysis-hero p-6">
        <p className="ui-kicker">\uC5F0\uB3D9 \uC13C\uD130</p>
        <h2 className="mt-2 ui-page-title">Lawbot · Market Analyze \uD1B5\uD569 \uD654\uBA74</h2>
        <p className="mt-2 max-w-3xl text-sm text-text-muted">
          \uD604\uC7AC system\uC5D0\uC11C\uB294 Lawbot\uACFC Market Analyze\uB97C \uC9C1\uC811 \uD558\uB098\uB85C \uBB36\uC5B4 \uC6B4\uC601\uD558\uB294
          \uB2E8\uACC4\uB294 \uC544\uB2C8\uACE0, \uAC01\uAC01\uC758 \uBD84\uC11D \uACB0\uACFC\uB97C system \uC5C5\uBB34 \uD750\uB984\uC5D0 \uD761\uC218\uD558\uB294
          \uAD6C\uC870\uB85C \uAC00\uACE0 \uC788\uC2B5\uB2C8\uB2E4.
        </p>
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
