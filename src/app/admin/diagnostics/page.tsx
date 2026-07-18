import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DiagnosticsRunner } from "./diagnostics-runner";

export const dynamic = "force-dynamic";

type EnvShape = { set: boolean; length?: number; prefix?: string; hasWhitespace?: boolean };

function describe(value: string | undefined): EnvShape {
  const v = value?.trim();
  if (!v) return { set: false };
  return { set: true, length: v.length, prefix: v.slice(0, 4), hasWhitespace: v !== value };
}

const ROWS: { label: string; env: string; get: () => EnvShape; note?: string }[] = [
  { label: "텔레그램 봇 토큰", env: "TELEGRAM_BOT_TOKEN", get: () => describe(process.env.TELEGRAM_BOT_TOKEN) },
  { label: "텔레그램 관리자 chat id", env: "TELEGRAM_ADMIN_CHAT_ID", get: () => describe(process.env.TELEGRAM_ADMIN_CHAT_ID) },
  { label: "텔레그램 chat id (구 변수)", env: "TELEGRAM_CHAT_ID", get: () => describe(process.env.TELEGRAM_CHAT_ID), note: "위 값이 있으면 불필요" },
  { label: "Anthropic API 키", env: "ANTHROPIC_API_KEY", get: () => describe(process.env.ANTHROPIC_API_KEY), note: "sk-a 로 시작해야 정상" },
  { label: "Sentry DSN (서버)", env: "SENTRY_DSN", get: () => describe(process.env.SENTRY_DSN), note: "http 로 시작해야 정상" },
  { label: "Sentry DSN (클라이언트)", env: "NEXT_PUBLIC_SENTRY_DSN", get: () => describe(process.env.NEXT_PUBLIC_SENTRY_DSN), note: "서버 DSN과 같은 값" },
  { label: "Cron Secret", env: "CRON_SECRET", get: () => describe(process.env.CRON_SECRET) },
  { label: "Site URL", env: "NEXT_PUBLIC_SITE_URL", get: () => describe(process.env.NEXT_PUBLIC_SITE_URL) }
];

export default function DiagnosticsPage() {
  const rows = ROWS.map((r) => ({ ...r, value: r.get() }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Diagnostics"
        title="외부 연동 진단"
        description="환경변수 실제 반영 상태와 텔레그램 발송 결과를 서버에서 직접 확인합니다. 비밀값은 표시되지 않습니다."
      />

      <Card className="p-5">
        <p className="ui-kicker">환경변수 반영 상태 (런타임 실측)</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-text-muted">
                <th className="pb-2 pr-3">항목</th>
                <th className="pb-2 pr-3">변수명</th>
                <th className="pb-2 pr-3">상태</th>
                <th className="pb-2 pr-3">길이</th>
                <th className="pb-2">앞 4글자</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.env} className="border-b border-line/50">
                  <td className="py-2 pr-3">
                    {r.label}
                    {r.note && <span className="ml-1 text-[10px] text-text-muted">({r.note})</span>}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs text-text-muted">{r.env}</td>
                  <td className="py-2 pr-3">
                    {r.value.set ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        설정됨
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                        없음
                      </span>
                    )}
                    {r.value.hasWhitespace && (
                      <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        앞뒤 공백
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{r.value.length ?? "—"}</td>
                  <td className="py-2 font-mono text-xs">{r.value.prefix ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          &quot;없음&quot;이면 Vercel에 해당 이름으로 등록되지 않았거나 Production 스코프가 아니거나, 등록 후 재배포를 하지 않은 것입니다.
        </p>
      </Card>

      <DiagnosticsRunner />
    </div>
  );
}
