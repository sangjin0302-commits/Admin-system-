import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DeployStatusCard } from "@/components/admin/deploy-status-card";
import { SetupLink } from "./setup-link";
import { getSiteSettings } from "@/lib/services/site-settings";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

type CheckResult = "ok" | "missing" | "optional";

type SetupItem = {
  key: string;
  name: string;
  status: CheckResult;
  hint: string;
  steps: string[];
  link?: string;
  cost?: string;
};

export default async function SetupPage() {
  const site = await getSiteSettings();
  const showDeployCard = await isFeatureEnabled("deploy_status_card");

  // 환경변수는 process.env로 확인 (정확한 값은 노출 안 함, 존재 여부만)
  const env = {
    telegramBot: !!process.env.TELEGRAM_BOT_TOKEN,
    telegramAdmin: !!(process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID),
    telegramChannel: !!process.env.TELEGRAM_CHANNEL_ID,
    cronSecret: !!process.env.CRON_SECRET,
    siteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    blob: !!process.env.BLOB_READ_WRITE_TOKEN,
    sentry: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
    tossEnabled: process.env.NEXT_PUBLIC_TOSS_ENABLED === "1"
  };

  const items: SetupItem[] = [
    {
      key: "telegram_bot",
      name: "텔레그램 봇 (필수)",
      status: env.telegramBot && env.telegramAdmin ? "ok" : "missing",
      hint: "신규 의뢰 즉시 푸시 + 24h 미응답 alert + 주간 리포트",
      cost: "무료",
      steps: [
        "텔레그램 @BotFather → /newbot → 봇 이름 정하기",
        "BOT_TOKEN 발급받기",
        "본인 텔레그램으로 봇 검색 → /start",
        "https://api.telegram.org/bot<TOKEN>/getUpdates 열기 → chat.id 확인",
        "Vercel Settings → Environment Variables:",
        "  · TELEGRAM_BOT_TOKEN = 봇토큰",
        "  · TELEGRAM_ADMIN_CHAT_ID = 본인 chat id",
        "Redeploy"
      ],
      link: "https://t.me/BotFather"
    },
    {
      key: "telegram_channel",
      name: "텔레그램 공개 채널 (마케팅)",
      status: env.telegramChannel ? "ok" : "optional",
      hint: "신규 블로그 글 → 구독자 자동 발송",
      cost: "무료",
      steps: [
        "텔레그램 새 채널 생성 (이름: ETHOS 행정사 등)",
        "채널 설정 → 관리자 추가 → 위에서 만든 봇 추가",
        "채널 username 확인 (@ethos_attorney_jean 등) 또는 channel id",
        "Vercel env: TELEGRAM_CHANNEL_ID = @채널명 또는 -100xxxxx"
      ],
      link: "https://telegram.org"
    },
    {
      key: "vercel_blob",
      name: "Vercel Blob Storage (이미지 업로드)",
      status: env.blob ? "ok" : "missing",
      hint: "로고/사진/OG 이미지 업로드 가능하게",
      cost: "무료 (1GB)",
      steps: [
        "Vercel Dashboard → Storage → Create → Blob",
        "환경변수 BLOB_READ_WRITE_TOKEN 자동 등록됨",
        "Redeploy"
      ],
      link: "https://vercel.com/dashboard/stores"
    },
    {
      key: "anthropic",
      name: "Anthropic API (블로그 메타 생성)",
      status: env.anthropic ? "ok" : "optional",
      hint: "블로그 50편 description 자동 생성 (1회 ~$0.5)",
      cost: "$0.5 (1회) + 글당 $0.01",
      steps: [
        "console.anthropic.com 가입",
        "결제 카드 등록 → $5 충전",
        "API Keys → Create Key",
        "Vercel env: ANTHROPIC_API_KEY = sk-ant-...",
        "POST /api/admin/blog-meta-batch?max=50 실행"
      ],
      link: "https://console.anthropic.com"
    },
    {
      key: "cron_secret",
      name: "Cron Secret (보안)",
      status: env.cronSecret ? "ok" : "missing",
      hint: "cron 라우트 무단 호출 차단",
      cost: "무료",
      steps: [
        "터미널에서: openssl rand -hex 32",
        "출력값 복사",
        "Vercel env: CRON_SECRET = 복사한값"
      ]
    },
    {
      key: "site_url",
      name: "Site URL",
      status: env.siteUrl ? "ok" : "missing",
      hint: "sitemap/OG/JSON-LD 정확도",
      cost: "무료",
      steps: ["Vercel env: NEXT_PUBLIC_SITE_URL = https://ethosattorney.com"]
    },
    {
      key: "ga4",
      name: "Google Analytics 4",
      status: site["analytics.gaId"] ? "ok" : "optional",
      hint: "페이지뷰/스크롤/funnel/채널 클릭 추적",
      cost: "무료",
      steps: [
        "analytics.google.com → 속성 만들기",
        "측정 ID 확인 (G-XXXXXXXXX)",
        "/admin/site-content → analytics.gaId 입력"
      ],
      link: "https://analytics.google.com"
    },
    {
      key: "google_console",
      name: "Google Search Console",
      status: site["seo.googleVerification"] ? "ok" : "optional",
      hint: "Google 검색 색인 + sitemap 제출",
      cost: "무료",
      steps: [
        "search.google.com/search-console",
        "URL 접두어: https://ethosattorney.com",
        "HTML 태그 인증 선택 → content 값 복사",
        "/admin/site-content → seo.googleVerification 입력",
        "저장 후 Search Console에서 '확인' 클릭",
        "Sitemaps → https://ethosattorney.com/sitemap.xml 제출"
      ],
      link: "https://search.google.com/search-console"
    },
    {
      key: "naver_advisor",
      name: "Naver Search Advisor",
      status: site["seo.naverVerification"] ? "ok" : "optional",
      hint: "네이버 검색 노출 (한국 트래픽 핵심)",
      cost: "무료",
      steps: [
        "searchadvisor.naver.com",
        "사이트 등록 → URL 입력",
        "HTML 태그 인증 → content 값 복사",
        "/admin/site-content → seo.naverVerification 입력",
        "Search Advisor에서 '확인'",
        "요청 → 사이트맵 제출 (/sitemap.xml + /feed.xml)"
      ],
      link: "https://searchadvisor.naver.com"
    },
    {
      key: "payment_bank",
      name: "계좌이체 정보 (Toss 대신)",
      status: site["payment.accountNumber"] ? "ok" : "missing",
      hint: "Toss 결제 가입 부담 (33만원) 회피, 계좌이체 안내",
      cost: "무료",
      steps: [
        "/admin/site-content →",
        "  · payment.bankName: 은행명 (예: 국민은행)",
        "  · payment.accountNumber: 계좌번호",
        "  · payment.accountHolder: 예금주 (기본: 행정사 Jean)",
        "/portal/payments/checkout/[orderId] 자동으로 계좌 안내 표시"
      ]
    },
    {
      key: "sentry",
      name: "Sentry (선택)",
      status: env.sentry ? "ok" : "optional",
      hint: "프로덕션 에러 추적",
      cost: "무료 (5k events/월)",
      steps: [
        "sentry.io 가입 → Next.js 프로젝트 생성",
        "DSN 복사 (https://xxxxx@oXXXXX.ingest.sentry.io/XXXXX 형태)",
        "Vercel env 2개 추가 (같은 DSN 값):",
        "  · SENTRY_DSN = 복사한 DSN",
        "  · NEXT_PUBLIC_SENTRY_DSN = 같은 DSN",
        "Redeploy"
      ],
      link: "https://sentry.io"
    },
    {
      key: "toss",
      name: "Toss Payments (보류)",
      status: env.tossEnabled ? "ok" : "optional",
      hint: "33만원 가입비 — 현재 비활성. 수임 본격화 후 검토",
      cost: "33만원 가입 + 결제 1.5~2%",
      steps: [
        "보류 상태: 계좌이체로 운영",
        "활성화 시:",
        "  · Toss Payments 가입 + 가맹점 심사",
        "  · NEXT_PUBLIC_TOSS_CLIENT_KEY + TOSS_SECRET_KEY 발급",
        "  · Vercel env: NEXT_PUBLIC_TOSS_ENABLED = 1"
      ]
    }
  ];

  const okCount = items.filter((i) => i.status === "ok").length;
  const missingCount = items.filter((i) => i.status === "missing").length;
  const optionalCount = items.filter((i) => i.status === "optional").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Setup"
        title="외부 설정 가이드"
        description="필수/선택 외부 서비스 설정 상태 한눈 보기. ✓ = 설정 완료, ✗ = 필수 누락, — = 선택."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-text-muted">완료</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{okCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">필수 누락</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{missingCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">선택</p>
          <p className="mt-1 text-2xl font-bold text-text-muted">{optionalCount}</p>
        </Card>
      </div>

      <div className="space-y-3">
        {items.map((it) => (
          <details
            key={it.key}
            open={it.status === "missing"}
            className={`rounded-2xl border ${
              it.status === "ok"
                ? "border-emerald-200 bg-emerald-50/40"
                : it.status === "missing"
                  ? "border-red-200 bg-red-50/40"
                  : "border-line bg-surface"
            } p-5`}
          >
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        it.status === "ok" ? "bg-emerald-600" : it.status === "missing" ? "bg-red-600" : "bg-text-muted"
                      }`}
                    >
                      {it.status === "ok" ? "✓" : it.status === "missing" ? "✗" : "—"}
                    </span>
                    <p className="font-serif text-base font-bold text-text-strong">{it.name}</p>
                    {it.cost && (
                      <span className="rounded-full bg-gold-soft/60 px-2 py-0.5 text-[10px] font-bold text-gold-deep">
                        {it.cost}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-text-muted">{it.hint}</p>
                </div>
                {it.link && <SetupLink href={it.link} />}
              </div>
            </summary>
            <ol className="mt-4 space-y-1.5 border-t border-line/70 pt-4 text-xs leading-6 text-text">
              {it.steps.map((s, i) => (
                <li key={i} className="font-mono">
                  {s.startsWith("  ") ? <span className="text-gold-deep">{s}</span> : `${i + 1}. ${s}`}
                </li>
              ))}
            </ol>
          </details>
        ))}
      </div>

      <Card className="p-5">
        <p className="ui-kicker">진행 순서 추천</p>
        <ol className="mt-3 space-y-2 text-sm text-text">
          <li>1. <strong>NEXT_PUBLIC_SITE_URL + CRON_SECRET</strong> (Vercel env, 5분)</li>
          <li>2. <strong>Vercel Blob</strong> (이미지 업로드, 5분)</li>
          <li>3. <strong>텔레그램 봇 + Admin Chat</strong> (의뢰 알림, 10분)</li>
          <li>4. <strong>계좌이체 정보</strong> (/admin/site-content, 2분)</li>
          <li>5. <strong>Google Search Console + Naver Search Advisor</strong> (SEO, 15분)</li>
          <li>6. <strong>GA4</strong> (분석, 10분)</li>
          <li>7. <strong>Anthropic API</strong> (블로그 메타 batch, 선택, 20분)</li>
          <li>8. <strong>텔레그램 공개 채널</strong> (구독자 확보, 선택)</li>
        </ol>
      </Card>

      {showDeployCard && <DeployStatusCard />}
    </div>
  );
}
