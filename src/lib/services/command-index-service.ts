/**
 * 명령 팔레트 인덱스 서비스.
 *
 * 관리자 페이지·최근 사건/문의·플래그·자주 쓰는 액션을 하나의 인덱스로 통합.
 * - 페이지: 정적 목록 (RTS·SSR 없이 상수)
 * - 사건/문의: 최근 20건 (5분 캐시)
 * - 플래그: FEATURE_REGISTRY 전체 (즉시 토글용)
 * - 액션: 자주 쓰는 관리자 액션 (별칭 지원)
 *
 * Feature flag: `command_palette`.
 */

import { prisma } from "@/lib/prisma/client";
import { FEATURE_REGISTRY } from "@/lib/services/feature-flags-service";

const CACHE_MS = 5 * 60 * 1000;

export type CommandGroup = "page" | "case" | "inquiry" | "flag" | "action";

export type CommandItem = {
  id: string;
  group: CommandGroup;
  label: string;
  hint?: string; // description/subtitle
  href?: string;
  action?: string; // e.g. "toggle_flag:one_click_close"
  aliases?: string[]; // for fuzzy matching (e.g. "새 의뢰")
  keywords?: string[]; // extra tokens indexed for search
};

const STATIC_PAGES: CommandItem[] = [
  { id: "page:home", group: "page", label: "대시보드", href: "/admin", aliases: ["홈", "메인"] },
  { id: "page:morning", group: "page", label: "아침 3분 브리핑", href: "/admin/morning", aliases: ["브리핑", "morning", "아침"], keywords: ["KPI", "요약"] },
  { id: "page:inbox", group: "page", label: "통합 수신함", href: "/admin/inbox", aliases: ["인박스", "inbox", "미응답"], keywords: ["긴급", "SLA"] },
  { id: "page:funnel", group: "page", label: "전환 퍼널", href: "/admin/funnel", aliases: ["funnel", "전환률"], keywords: ["consult", "quote", "WON"] },
  { id: "page:channel-roi", group: "page", label: "채널 ROI", href: "/admin/channel-roi", aliases: ["ROI", "CPL", "CPA", "ROAS"], keywords: ["광고비", "채널"] },
  { id: "page:ref-tracking", group: "page", label: "레퍼럴 트래킹", href: "/admin/ref-tracking", aliases: ["ref", "referral", "유입"], keywords: ["UTM"] },
  { id: "page:landing-gaps", group: "page", label: "랜딩 갭 파인더", href: "/admin/landing-gaps", aliases: ["landing", "GSC", "키워드"], keywords: ["SEO"] },
  { id: "page:vips", group: "page", label: "VIP 리스트", href: "/admin/vips", aliases: ["VIP", "리피터"], keywords: ["repeat", "충성"] },
  { id: "page:tax-export", group: "page", label: "세무 CSV", href: "/admin/tax-export", aliases: ["세무", "tax", "CSV"], keywords: ["부가세", "결산"] },
  { id: "page:flag-audit", group: "page", label: "Flag 감사", href: "/admin/flag-audit", aliases: ["flag", "감사"], keywords: ["플래그"] },
  { id: "page:quote-calc", group: "page", label: "견적 계산기", href: "/admin/quote-calc", aliases: ["견적", "quote", "가격", "calc"], keywords: ["상담", "안내"] },
  { id: "page:receivables", group: "page", label: "미수금 알림", href: "/admin/receivables", aliases: ["미수금", "unpaid", "receivable"], keywords: ["결제"] },
  { id: "page:blog-rewrite-queue", group: "page", label: "블로그 리라이트 큐", href: "/admin/blog-rewrite-queue", aliases: ["리라이트", "rewrite", "CTR"], keywords: ["GSC", "SEO"] },
  { id: "page:utm-heatmap", group: "page", label: "UTM heatmap", href: "/admin/utm-heatmap", aliases: ["UTM", "heatmap", "전환"], keywords: ["소스", "매체"] },
  { id: "page:inquiries", group: "page", label: "문의 목록", href: "/admin/inquiries", aliases: ["문의"] },
  { id: "page:inquiries.new", group: "page", label: "새 문의 등록", href: "/admin/inquiries/new", aliases: ["새 의뢰", "신규 문의", "문의 등록"] },
  { id: "page:cases", group: "page", label: "사건 목록", href: "/admin/cases", aliases: ["사건"] },
  { id: "page:cases.kanban", group: "page", label: "사건 칸반 보드", href: "/admin/cases/kanban", aliases: ["칸반", "kanban"] },
  { id: "page:advisor", group: "page", label: "운영 참모", href: "/admin/advisor" },
  { id: "page:ai-assistant", group: "page", label: "AI 어시스턴트", href: "/admin/ai-assistant" },
  { id: "page:lawbot", group: "page", label: "AI 분석 (Lawbot)", href: "/admin/lawbot" },
  { id: "page:stats", group: "page", label: "통계 / 재무", href: "/admin/stats" },
  { id: "page:ledger", group: "page", label: "원장 관리", href: "/admin/ledger" },
  { id: "page:site-content", group: "page", label: "홈페이지 운영", href: "/admin/site-content" },
  { id: "page:case-studies", group: "page", label: "사례 관리", href: "/admin/case-studies" },
  { id: "page:testimonials", group: "page", label: "후기 관리", href: "/admin/testimonials" },
  { id: "page:fees", group: "page", label: "비용 관리", href: "/admin/fees" },
  { id: "page:audit-log", group: "page", label: "활동 로그", href: "/admin/activity" },
  { id: "page:features", group: "page", label: "기능 플래그", href: "/admin/features", aliases: ["플래그", "feature"] },
  { id: "page:macros", group: "page", label: "매크로 관리", href: "/admin/macros", aliases: ["macro", "매크로"] },
];

const STATIC_ACTIONS: CommandItem[] = [
  { id: "action:new-inquiry", group: "action", label: "새 문의 등록", href: "/admin/inquiries/new", aliases: ["새 의뢰"] },
  { id: "action:new-case", group: "action", label: "새 사건 생성", href: "/admin/cases", aliases: ["사건 생성"] },
  { id: "action:refresh-flags", group: "action", label: "기능 플래그 새로고침", action: "refresh_flags" },
];

type Cached = { at: number; items: CommandItem[] };
let _recentCache: Cached | null = null;

async function fetchRecent(): Promise<CommandItem[]> {
  const [cases, inquiries] = await Promise.all([
    prisma.caseMatter
      .findMany({
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, title: true, caseNo: true, status: true },
      })
      .catch(() => []),
    prisma.inquiry
      .findMany({
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, title: true, contactName: true, status: true },
      })
      .catch(() => []),
  ]);

  const caseItems: CommandItem[] = cases.map((c) => ({
    id: `case:${c.id}`,
    group: "case",
    label: c.title,
    hint: `${c.caseNo ?? "사건번호 미정"} · ${c.status}`,
    href: `/admin/cases/${c.id}`,
    keywords: [c.caseNo ?? "", c.status],
  }));

  const inquiryItems: CommandItem[] = inquiries.map((q) => ({
    id: `inquiry:${q.id}`,
    group: "inquiry",
    label: q.title,
    hint: `${q.contactName} · ${q.status}`,
    href: `/admin/inquiries/${q.id}`,
    keywords: [q.contactName, q.status],
  }));

  return [...caseItems, ...inquiryItems];
}

function flagItems(): CommandItem[] {
  return FEATURE_REGISTRY.map((f) => ({
    id: `flag:${f.key}`,
    group: "flag" as const,
    label: f.label,
    hint: f.description ?? f.key,
    action: `toggle_flag:${f.key}`,
    keywords: [f.key, f.category],
  }));
}

/** 인덱스 전체 반환 — 5분 인메모리 캐시 (최근 목록만). */
export async function buildCommandIndex(): Promise<CommandItem[]> {
  const now = Date.now();
  let recent: CommandItem[];
  if (_recentCache && now - _recentCache.at < CACHE_MS) {
    recent = _recentCache.items;
  } else {
    recent = await fetchRecent();
    _recentCache = { at: now, items: recent };
  }
  return [...STATIC_PAGES, ...STATIC_ACTIONS, ...flagItems(), ...recent];
}

export function invalidateCommandIndex(): void {
  _recentCache = null;
}
