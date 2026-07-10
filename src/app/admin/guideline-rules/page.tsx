import Link from "next/link";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  FORBIDDEN_PHRASES,
  getCustomRules,
} from "@/lib/services/marketing-guideline-service";
import { RulesClient } from "./rules-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "마케팅 지침 규칙 — 관리자",
};

export default async function GuidelineRulesPage() {
  const enabled = await isFeatureEnabled("marketing_guideline_scanner");
  if (!enabled) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="ui-kicker">Marketing Guideline</p>
          <h1 className="mt-2 ui-page-title">마케팅 지침 규칙</h1>
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

  const custom = await getCustomRules();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Marketing Guideline</p>
        <h1 className="mt-2 ui-page-title">마케팅 지침 규칙</h1>
        <p className="mt-2 text-sm text-text-muted">
          v6.4 지침 기본 규칙 {FORBIDDEN_PHRASES.length}개 + 사용자 정의 규칙 {custom.length}개.
        </p>
        <div className="mt-3">
          <Link href="/admin/guideline-audit" className="text-xs text-primary underline">
            전체 감사 실행 →
          </Link>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-text-strong">기본 규칙 (v6.4 preload)</h2>
        <p className="mt-1 text-xs text-text-muted">코드에 내장 · 편집 불가</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-left text-text-muted">
                <th className="py-2 pr-2">금지 문구</th>
                <th className="py-2 pr-2">심각도</th>
                <th className="py-2 pr-2">사유</th>
                <th className="py-2 pr-2">대체 제안</th>
              </tr>
            </thead>
            <tbody>
              {FORBIDDEN_PHRASES.map((r) => (
                <tr key={r.pattern} className="border-b border-line/40 align-top">
                  <td className="py-2 pr-2">
                    <code className="rounded bg-line/30 px-1.5 py-0.5">{r.pattern}</code>
                  </td>
                  <td className="py-2 pr-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        r.severity === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.severity}
                    </span>
                  </td>
                  <td className="py-2 pr-2 text-text-muted">{r.reason}</td>
                  <td className="py-2 pr-2 text-green-700">{r.suggestion ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <RulesClient initialCustom={custom} />
    </div>
  );
}
