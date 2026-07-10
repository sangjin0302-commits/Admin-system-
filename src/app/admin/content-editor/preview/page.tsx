import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getContent } from "@/lib/services/site-content-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { CONTENT_KEYS } from "@/lib/services/site-content-keys";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "콘텐츠 미리보기 — 관리자"
};

type SearchParams = { overrides?: string | string[] };

function decodeOverrides(raw: string | string[] | undefined): Record<string, string> {
  if (!raw) return {};
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str) return {};
  try {
    const json = Buffer.from(str, "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

async function get(key: string, overrides: Record<string, string>): Promise<string> {
  return await getContent(key, overrides);
}

export default async function ContentEditorPreviewPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const enabled = await isFeatureEnabled("cms_preview");
  if (!enabled) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="ui-kicker">Preview</p>
          <h1 className="mt-2 ui-page-title">미리보기 비활성</h1>
          <p className="mt-2 text-sm text-text-muted">
            <code className="rounded bg-line/40 px-1 py-0.5 text-xs">cms_preview</code> flag를 켜세요.
          </p>
        </Card>
      </div>
    );
  }

  const params = (await searchParams) ?? {};
  const overrides = decodeOverrides(params.overrides);

  // 대표적으로 홈페이지 CMS 키를 렌더 (오버라이드 적용)
  const heroTitle = await get("home.hero.title", overrides);
  const heroSubtitle = await get("home.hero.subtitle", overrides);
  const heroBadge = await get("home.hero.badge", overrides);
  const ctaLabel = await get("home.cta.label", overrides);

  // 나머지 CMS 키 — override에 포함된 키만 별도로 표시
  const otherKeys = CONTENT_KEYS.map((c) => c.key).filter(
    (k) => !["home.hero.title", "home.hero.subtitle", "home.hero.badge", "home.cta.label"].includes(k)
  );
  const others: Array<{ key: string; value: string; overridden: boolean }> = [];
  for (const k of otherKeys) {
    const value = await get(k, overrides);
    others.push({ key: k, value, overridden: Object.prototype.hasOwnProperty.call(overrides, k) });
  }
  const overrideKeys = Object.keys(overrides);

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-yellow-900">미리보기 모드</p>
            <p className="text-xs text-yellow-800 mt-0.5">
              오버라이드 {overrideKeys.length}개 적용 · 저장되지 않은 값입니다.
            </p>
          </div>
          <Link href="/admin/content-editor" className="text-xs underline text-yellow-900">
            편집기로 돌아가기 →
          </Link>
        </div>
      </Card>

      {/* 히어로 미리보기 */}
      <Card className="p-8">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-wider text-text-muted">{heroBadge}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-text-strong whitespace-pre-line">
            {heroTitle}
          </h1>
          <p className="text-base text-text-muted">{heroSubtitle}</p>
          <div>
            <span className="inline-block rounded-md bg-primary px-5 py-2 text-sm font-medium text-white">
              {ctaLabel}
            </span>
          </div>
        </div>
      </Card>

      {/* 기타 CMS 키 */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">기타 CMS 키 ({others.length})</h2>
        <p className="text-xs text-text-muted mt-1">오버라이드 적용된 항목은 하이라이트됩니다.</p>
        <ul className="mt-3 space-y-1 text-xs">
          {others.map((o) => (
            <li
              key={o.key}
              className={`flex gap-2 rounded px-2 py-1 ${o.overridden ? "bg-yellow-50 border border-yellow-200" : ""}`}
            >
              <code className="text-text-muted min-w-[220px]">{o.key}</code>
              <span className="text-text-strong truncate">{o.value.slice(0, 120)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
