/**
 * Admin 페이지 tier 레지스트리 — 감춤 모드(admin_hide_mode)에서 사용.
 *
 * 목적: 100+ admin 페이지를 사용 빈도(tier)로 분류하여, 기본은 "core"만 노출.
 * 페이지를 삭제하지 않음 — 숨김만 처리. Command palette(Ctrl+K)에서 여전히 접근 가능.
 */

export type PageTier = "core" | "frequent" | "occasional" | "advanced";

/** path (e.g. "inbox", "cases/kanban") → tier */
export const PAGE_TIERS: Record<string, PageTier> = {
  // core (매일)
  "": "core", // /admin dashboard
  "inbox": "core",
  "morning": "core",
  "cases": "core",
  "cases/kanban": "core",
  "content-editor": "core",
  "site-content": "core",
  "marketing-guideline": "core",
  "guideline-audit": "core",
  "blog": "core",
  "blog-import": "core",
  "blog-rewrite-queue": "core",
  "blog-translate": "core",
  "blog-translation": "core",
  "quote-calc": "core",
  "testimonials": "core",
  "fee-tracking": "core",
  "setup": "core",
  "flag-audit": "core",
  "insights": "core",
  "telegram": "core",
  "inquiries": "core",

  // frequent (매주)
  "kakao-stats": "frequent",
  "quote-conversion": "frequent",
  "macro-hotkeys": "frequent",
  "ai-assistant": "frequent",
  "saved-filters": "frequent",
  "morning-briefing": "frequent",
  "receivables": "frequent",
  "vips": "frequent",
  "tax-export": "frequent",
  "channel-roi": "frequent",
  "funnel": "frequent",
  "ref-tracking": "frequent",
  "landing-gaps": "frequent",
  "utm-heatmap": "frequent",
  "mentor": "frequent",
  "my-activity": "frequent",
  "similar-search": "frequent",
  "tone-tools": "frequent",
  "stats": "frequent",
  "advisor": "frequent",

  // occasional (가끔)
  "market": "occasional",
  "ai-accuracy": "occasional",
  "survey-results": "occasional",
  "ab-experiments": "occasional",
  "ab-tests": "occasional",
  "seo-audit": "occasional",
  "section-order": "occasional",
  "editor-permissions": "occasional",
  "guideline-rules": "occasional",
  "label-training": "occasional",
  "ai-draft-check": "occasional",
  "email-templates": "occasional",
  "ai-agent": "occasional",
  "ai-prompts": "occasional",
  "personalization": "occasional",
  "deploy-status": "occasional",
  "ledger": "occasional",
  "intake-sources": "occasional",
  "monitoring": "occasional",
  "activity": "occasional",
  "bot-stats/lawbot": "occasional",
  "fee-estimator": "occasional",
  "case-studies": "occasional",
  "credentials": "occasional",
  "fees": "occasional",
  "kpi": "occasional",
  "audit": "occasional",
  "signatures": "occasional",
  "payments": "occasional",
  "settings/roles": "occasional",
  "scheduled-jobs": "occasional",
  "auto-conversion": "occasional",
  "messages": "occasional",
  "win-rate": "occasional",
  "doc-generator": "occasional",
  "errors": "occasional",
  "cache": "occasional",
  "campaigns": "occasional",
  "referrals": "occasional",
  "search": "occasional",
  "ocr": "occasional",
  "transcription": "occasional",
  "public-data": "occasional",
  "document-lab": "occasional",
  "bulk-upload": "occasional",
  "crm": "occasional",
  "followup": "occasional",
  "revenue-forecast": "occasional",
  "ltv": "occasional",
  "reports": "occasional",
  "voice-assistant": "occasional",
  "vision": "occasional",
  "computer-use": "occasional",
  "tax-invoices": "occasional",
  "integrations/naver-talktalk": "occasional",
  "integrations": "occasional",

  // advanced (드묾)
  "orgs": "advanced",
  "orgs/new": "advanced",
  "self-healing": "advanced",
  "sentry-monitor": "advanced",
  "ai-finetune": "advanced",
  "ai-metrics": "advanced",
  "ai-regression": "advanced",
  "ai-subscription": "advanced",
  "ai-router": "advanced",
  "ai-standby": "advanced",
  "notifications": "advanced",
  "deploy-status-check": "advanced",
  "dashboard-v2": "advanced",
  "audit-cleanup": "advanced",
  "audit-log": "advanced",
  "webhooks": "advanced",
  "db-perf": "advanced",
  "backup": "advanced",
  "team-chat": "advanced",
  "tenants": "advanced",
  "push-notifications": "advanced",
  "mobile-app": "advanced",
  "pii-tool": "advanced",
  "settings/2fa": "advanced",
  "hide-mode": "advanced",
  "api-marketplace": "advanced",
  "architecture": "advanced",
  "adaptive-ui": "advanced",
  "chaos": "advanced",
  "canary": "advanced",
  "auto-rollback": "advanced",
  "auto-flow": "advanced",
  "auto-reply": "advanced",
  "auto-marketing": "advanced",
  "b2b": "advanced",
  "brainstorm": "advanced",
  "briefing": "advanced",
  "brochure": "advanced",
  "call-recorder": "advanced",
  "careers": "advanced",
  "case-stories": "advanced",
  "chaos-engineering": "advanced",
  "community": "advanced",
  "consult-availability": "advanced",
  "courses": "advanced",
  "datasets": "advanced",
  "db": "advanced",
  "deadline-autopilot": "advanced",
  "deadline-calculator": "advanced",
  "deadlines": "advanced",
  "document-dictation": "advanced",
  "document-similarity": "advanced",
  "document-viewer": "advanced",
  "edge-cache": "advanced",
  "fact-check": "advanced",
  "finance": "advanced",
  "franchise": "advanced",
  "features": "advanced",
  "ar-card": "advanced",
  "activity/legacy": "advanced",
};

const TIER_ORDER: PageTier[] = ["core", "frequent", "occasional", "advanced"];

/** admin_hide_mode 활성 시, 노출할 tier 집합. */
export function getVisibleTiers(hideMode: boolean, showAdvanced: boolean): Set<PageTier> {
  if (!hideMode) return new Set(TIER_ORDER);
  if (showAdvanced) return new Set(TIER_ORDER);
  return new Set<PageTier>(["core"]);
}

/** URL/path에서 tier 조회. path는 "/admin/..." 또는 "inbox" 등 suffix 허용. */
export function getPageTier(path: string): PageTier {
  let key = path;
  if (key.startsWith("/admin/")) key = key.slice("/admin/".length);
  else if (key === "/admin") key = "";
  else if (key.startsWith("/")) key = key.slice(1);
  // exact match first
  if (key in PAGE_TIERS) return PAGE_TIERS[key];
  // try progressive prefix (e.g. "cases/kanban/xxx" → "cases/kanban" → "cases")
  const parts = key.split("/");
  while (parts.length > 0) {
    const candidate = parts.join("/");
    if (candidate in PAGE_TIERS) return PAGE_TIERS[candidate];
    parts.pop();
  }
  // default: advanced (unknown pages hidden by default in hide mode)
  return "advanced";
}

/** helper: hideMode/showAdvanced 조건에서 이 path가 노출되는지. */
export function isPageVisible(path: string, hideMode: boolean, showAdvanced: boolean): boolean {
  const visible = getVisibleTiers(hideMode, showAdvanced);
  return visible.has(getPageTier(path));
}

export const TIER_LABELS: Record<PageTier, string> = {
  core: "핵심 (매일)",
  frequent: "자주 (매주)",
  occasional: "가끔",
  advanced: "고급 (드묾)",
};

export const TIER_LIST: PageTier[] = TIER_ORDER;
