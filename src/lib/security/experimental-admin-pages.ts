/**
 * 실험·데모 성격의 관리자 페이지 목록.
 *
 * 배경: 관리자 페이지가 241개인데 대부분은 메뉴에 없는 고아 페이지이고,
 * 그중 상당수는 1인·소규모 행정사 사무소 운영과 무관한 실험·데모·엔터프라이즈
 * 상상 기능이다(chaos·canary·ar-card·api-marketplace 등).
 *
 * 이 목록에 있는 경로는 기본적으로 접근이 차단된다(admin_experimental_pages 플래그 OFF).
 * 페이지·코드는 그대로 남는다 — /admin/features 에서 플래그를 켜면 즉시 되살아난다.
 *
 * 설계 원칙(보수적):
 *  - "확실히 데모·실험"인 것만 넣는다. 조금이라도 실무에 쓸 여지가 있으면 넣지 않는다.
 *  - 이 파일은 Edge 미들웨어에서도 import 되므로 prisma 등 무거운 의존을 넣지 않는다.
 *
 * 경로 표기는 "/admin/" 를 뗀 suffix 다(예: "chaos", "insights/journey").
 */
export const EXPERIMENTAL_ADMIN_PAGES: ReadonlySet<string> = new Set([
  // ── 인프라·SRE 데모 (사무소 운영과 무관) ──
  "chaos",
  "canary",
  "auto-rollback",
  "self-healing",
  "edge-cache",
  "observability/traces",
  "sentry-monitor",
  "deploy-status-check",
  "db/replicas",
  "architecture",
  "adaptive-ui",

  // ── 엔터프라이즈 상상 기능 (멀티테넌트·프랜차이즈·B2B 플랫폼) ──
  "api-marketplace",
  "franchise",
  "b2b",
  "community",
  "courses",
  "datasets",
  "partners",
  "tax-partners",
  "lawyer-referrals",
  "international",
  "onsite",
  "jobs",
  "careers",

  // ── AI 실험·튜닝 콘솔 (실서비스 아님) ──
  "ai-finetune",
  "ai-regression",
  "ai-router",
  "ai-standby",
  "ai-metrics",
  "ai-accuracy",
  "label-training",
  "rag-monitor",
  "brainstorm",

  // ── 마케팅·성장 실험 데모 ──
  "ar-card",
  "trust-badges",
  "pr-distribution",
  "lead-scoring",
  "personalization",
  "messenger-bot",
  "network",
  "interpreter",
  "whitepapers",
  "brochure",

  // ── 2차 정리: 메뉴에 없고 실무에 쓰이지 않는 데모·중복 화면 ──
  // (통합 설정·재무·기한 계산·사용자 관리·CMS·생산성 도구는 의도적으로 제외했다.)
  "ab-experiments",
  "ai-agent",
  "ai-draft-check",
  "ai-prompts",
  "audit-log", // nav 의 "audit" 와 중복
  "auto-flow",
  "auto-reply",
  "blog-translate",
  "blog-translation",
  "briefing", // nav 의 "morning"(아침 브리핑)과 중복
  "call-recorder",
  "case-stories",
  "deadline-autopilot",
  "document-dictation",
  "document-similarity",
  "document-viewer",
  "editor-permissions",
  "fact-check",
  "guideline-audit",
  "guideline-rules",
  "marketing-guideline",
  "i18n",
  "insights", // 하위 journey·personas·pricing 등 전부 포함
  "intake-funnel", // nav 의 "funnel" 과 중복
  "landing",
  "notifications", // nav 의 push-notifications 와 중복
  "precedent-verify",
  "precedents",
  "section-order",
  "security/anomalies",
  "self-docs",
  "sso",
  "text-compare",
  "timeline",
  "voice-memo",
  "workflows",
  // 채널별 마케팅 데모 (seo-audit·utm·competitors·search-trends·ad-optimizer 는 유지)
  "marketing/heatmap",
  "marketing/instagram",
  "marketing/naver-kin",
  "marketing/podcast",
  "marketing/shorts",
  "marketing/youtube",
  "marketing/reengagement",
]);

/**
 * 주어진 경로가 실험 페이지인지 판정한다.
 * "/admin/chaos", "chaos", "/admin/insights/journey" 등 모두 허용.
 */
export function isExperimentalAdminPath(path: string): boolean {
  let key = path;
  if (key.startsWith("/admin/")) key = key.slice("/admin/".length);
  else if (key.startsWith("/")) key = key.slice(1);
  // 쿼리스트링·트레일링 슬래시 제거
  key = key.split("?")[0].replace(/\/+$/, "");
  if (EXPERIMENTAL_ADMIN_PAGES.has(key)) return true;
  // 하위 경로도 함께 막는다(예: "chaos/scenario" → "chaos").
  const parts = key.split("/");
  while (parts.length > 1) {
    parts.pop();
    if (EXPERIMENTAL_ADMIN_PAGES.has(parts.join("/"))) return true;
  }
  return false;
}
