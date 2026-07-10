import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  getCustomRules,
  scanContent,
  type GuidelineViolation,
} from "@/lib/services/marketing-guideline-service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "마케팅 지침 감사 — 관리자",
};

type Finding = {
  source: "site_setting" | "blog_post";
  sourceId: string;
  label: string;
  href?: string;
  violations: GuidelineViolation[];
};

async function runAudit(): Promise<{ findings: Finding[]; errorCount: number; warnCount: number }> {
  const [settings, posts, custom] = await Promise.all([
    prisma.siteSetting.findMany({ select: { key: true, value: true } }),
    prisma.blogPost.findMany({
      select: { id: true, slug: true, title: true, body: true, excerpt: true },
    }),
    getCustomRules(),
  ]);

  const findings: Finding[] = [];
  let errorCount = 0;
  let warnCount = 0;

  for (const s of settings) {
    if (!s.value) continue;
    if (s.key === "feature.flags" || s.key === "marketing_guideline_rules") continue;
    const v = scanContent(s.value, custom);
    if (v.length === 0) continue;
    findings.push({
      source: "site_setting",
      sourceId: s.key,
      label: s.key,
      href: `/admin/content-editor`,
      violations: v,
    });
    for (const x of v) (x.severity === "error" ? errorCount++ : warnCount++);
  }

  for (const p of posts) {
    const combined = `${p.title ?? ""}\n${p.excerpt ?? ""}\n${p.body ?? ""}`;
    const v = scanContent(combined, custom);
    if (v.length === 0) continue;
    findings.push({
      source: "blog_post",
      sourceId: p.id,
      label: p.title || p.slug,
      href: `/admin/blog/${p.id}`,
      violations: v,
    });
    for (const x of v) (x.severity === "error" ? errorCount++ : warnCount++);
  }

  return { findings, errorCount, warnCount };
}

export default async function GuidelineAuditPage() {
  const enabled = await isFeatureEnabled("marketing_guideline_scanner");
  if (!enabled) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="ui-kicker">Marketing Guideline</p>
          <h1 className="mt-2 ui-page-title">마케팅 지침 감사</h1>
          <p className="mt-2 text-sm text-text-muted">
            이 기능은 비활성 상태입니다.{" "}
            <Link href="/admin/features" className="underline">
              기능 플래그
            </Link>
            에서 <code className="mx-1 rounded bg-line/40 px-1 text-xs">marketing_guideline_scanner</code>를 켜세요.
          </p>
        </Card>
      </div>
    );
  }

  const { findings, errorCount, warnCount } = await runAudit();

  const errorFindings = findings.filter((f) => f.violations.some((v) => v.severity === "error"));
  const warnOnlyFindings = findings.filter((f) => f.violations.every((v) => v.severity === "warn"));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Marketing Guideline</p>
        <h1 className="mt-2 ui-page-title">마케팅 지침 감사 (v6.4)</h1>
        <p className="mt-2 text-sm text-text-muted">
          SiteSetting 콘텐츠 + 블로그 포스트 전체를 스캔해 과대광고·CTA 규정 위반을 검출합니다.
        </p>
        <div className="mt-4 flex gap-4">
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2">
            <div className="text-[11px] text-red-700">Error</div>
            <div className="text-xl font-semibold text-red-700">{errorCount}</div>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2">
            <div className="text-[11px] text-amber-700">Warn</div>
            <div className="text-xl font-semibold text-amber-700">{warnCount}</div>
          </div>
          <div className="rounded-md border border-line bg-surface px-4 py-2">
            <div className="text-[11px] text-text-muted">위반 소스</div>
            <div className="text-xl font-semibold text-text-strong">{findings.length}</div>
          </div>
        </div>
        <div className="mt-4">
          <Link href="/admin/guideline-rules" className="text-xs text-primary underline">
            규칙 관리 →
          </Link>
        </div>
      </Card>

      {findings.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-text-muted">위반 사항 없음. 지침을 준수하는 상태입니다.</p>
        </Card>
      ) : (
        <>
          {errorFindings.length > 0 && (
            <FindingSection title="Error — 즉시 수정 필요" tone="error" findings={errorFindings} />
          )}
          {warnOnlyFindings.length > 0 && (
            <FindingSection title="Warn — 검토 권장" tone="warn" findings={warnOnlyFindings} />
          )}
        </>
      )}
    </div>
  );
}

function FindingSection({
  title,
  tone,
  findings,
}: {
  title: string;
  tone: "error" | "warn";
  findings: Finding[];
}) {
  const borderCls = tone === "error" ? "border-red-200" : "border-amber-200";
  return (
    <Card className={`p-5 ${borderCls}`}>
      <h2 className="text-base font-semibold text-text-strong">
        {title} ({findings.length})
      </h2>
      <div className="mt-4 space-y-4">
        {findings.map((f) => (
          <div key={`${f.source}:${f.sourceId}`} className="rounded-md border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] text-text-muted uppercase">
                  {f.source === "site_setting" ? "SiteSetting" : "블로그"}
                </p>
                <p className="mt-0.5 text-sm font-medium text-text-strong">{f.label}</p>
              </div>
              {f.href && (
                <Link href={f.href} className="text-xs text-primary underline">
                  이동 →
                </Link>
              )}
            </div>
            <ul className="mt-3 space-y-1.5">
              {f.violations.map((v, idx) => (
                <li
                  key={`${v.position}-${idx}`}
                  className="flex flex-wrap items-center gap-2 text-xs"
                >
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      v.severity === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {v.severity}
                  </span>
                  <code className="rounded bg-line/30 px-1.5 py-0.5 text-[11px]">
                    {v.phrase}
                  </code>
                  <span className="text-text-muted">— {v.reason}</span>
                  {v.suggestion && (
                    <span className="text-text-muted">
                      → 제안: <span className="text-green-700">{v.suggestion}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
