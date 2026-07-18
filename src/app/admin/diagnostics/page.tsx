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
  { label: "관리자 세션 비밀키", env: "ADMIN_SESSION_SECRET", get: () => describe(process.env.ADMIN_SESSION_SECRET), note: "없으면 아래 둘 중 하나 사용" },
  { label: "NextAuth 비밀키", env: "NEXTAUTH_SECRET", get: () => describe(process.env.NEXTAUTH_SECRET) },
  { label: "Auth 비밀키 (v5)", env: "AUTH_SECRET", get: () => describe(process.env.AUTH_SECRET) },
  { label: "관리자 아이디", env: "ADMIN_BASIC_AUTH_USER", get: () => describe(process.env.ADMIN_BASIC_AUTH_USER) },
  { label: "관리자 비밀번호", env: "ADMIN_BASIC_AUTH_PASSWORD", get: () => describe(process.env.ADMIN_BASIC_AUTH_PASSWORD) },
  { label: "Site URL", env: "NEXT_PUBLIC_SITE_URL", get: () => describe(process.env.NEXT_PUBLIC_SITE_URL) },

  // Lawbot — /quick-check(AI 사전진단)은 아래 3개가 모두 있어야 동작한다.
  { label: "Lawbot 브릿지 주소 ★", env: "LAWBOT_BRIDGE_BASE_URL", get: () => describe(process.env.LAWBOT_BRIDGE_BASE_URL), note: "quick-check 필수" },
  { label: "Lawbot 서비스 키 ★", env: "LAWBOT_SERVICE_KEY", get: () => describe(process.env.LAWBOT_SERVICE_KEY), note: "quick-check 필수" },
  { label: "Lawbot 호출자 ID ★", env: "LAWBOT_SERVICE_CALLER", get: () => describe(process.env.LAWBOT_SERVICE_CALLER), note: "quick-check 필수" },
  { label: "Lawbot 분석 URL (다른 계열)", env: "LAWBOT_ANALYZE_URL", get: () => describe(process.env.LAWBOT_ANALYZE_URL), note: "사건 자동분석용, quick-check와 별개" },
  { label: "Lawbot 분석 토큰 (다른 계열)", env: "LAWBOT_ANALYZE_TOKEN", get: () => describe(process.env.LAWBOT_ANALYZE_TOKEN) },
  { label: "Lawbot 자동호출 허용", env: "LAWBOT_ENABLE_AUTOMATIC_CALLS", get: () => describe(process.env.LAWBOT_ENABLE_AUTOMATIC_CALLS), note: "true 여야 자동 분석 동작" },
  { label: "Lawbot 챗 API URL (또 다른 계열)", env: "LAWBOT_API_URL", get: () => describe(process.env.LAWBOT_API_URL) },

  // 법제처 계열 — /admin/law-research, /law-lookup, 공개 법령검색이 쓰는 "다른" 라인.
  // Lawbot 브릿지와 완전히 별개다. 이쪽이 비어 있으면 법령 검색 결과가 0건으로만 나온다.
  { label: "법제처 프록시 주소", env: "LAW_PROXY_URL", get: () => describe(process.env.LAW_PROXY_URL), note: "미설정 시 하드코딩 IP로 폴백" },
  { label: "법제처 프록시 토큰 ★", env: "LAW_PROXY_TOKEN", get: () => describe(process.env.LAW_PROXY_TOKEN), note: "법령검색 필수" },
  { label: "법제처 OC 계정 ★", env: "LAW_OC", get: () => describe(process.env.LAW_OC), note: "법령검색 필수" },
  { label: "생활법령 키", env: "EASYLAW_KEY", get: () => describe(process.env.EASYLAW_KEY) },

  // 시장분석 — 외부 봇이 아니라 네이버 API를 직접 쓴다.
  { label: "네이버 검색 ID", env: "NAVER_CLIENT_ID", get: () => describe(process.env.NAVER_CLIENT_ID), note: "시장분석 수집용" },
  { label: "네이버 검색 시크릿", env: "NAVER_CLIENT_SECRET", get: () => describe(process.env.NAVER_CLIENT_SECRET) },
  { label: "네이버 데이터랩 ID", env: "NAVER_DATALAB_CLIENT_ID", get: () => describe(process.env.NAVER_DATALAB_CLIENT_ID) },
  { label: "네이버 데이터랩 시크릿", env: "NAVER_DATALAB_CLIENT_SECRET", get: () => describe(process.env.NAVER_DATALAB_CLIENT_SECRET) },

  // Notion
  { label: "Notion 토큰", env: "NOTION_TOKEN", get: () => describe(process.env.NOTION_TOKEN) },
  { label: "Notion 참고 홈페이지 DB", env: "NOTION_REFERENCE_WEBSITE_DATABASE_ID", get: () => describe(process.env.NOTION_REFERENCE_WEBSITE_DATABASE_ID) },
  { label: "Notion 참고 자료 DB", env: "NOTION_REFERENCE_ARCHIVE_DATABASE_ID", get: () => describe(process.env.NOTION_REFERENCE_ARCHIVE_DATABASE_ID) },

  // 보안
  { label: "Upstash Redis URL", env: "UPSTASH_REDIS_REST_URL", get: () => describe(process.env.UPSTASH_REDIS_REST_URL), note: "관리자 로그인 분산 차단" },
  { label: "Upstash Redis 토큰", env: "UPSTASH_REDIS_REST_TOKEN", get: () => describe(process.env.UPSTASH_REDIS_REST_TOKEN) }
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
