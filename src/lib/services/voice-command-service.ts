import { logger } from "@/lib/utils/logger";

export type CommandAction =
  | { type: "navigate"; href: string }
  | { type: "toast"; message: string }
  | { type: "query"; resource: string };

export type Command = {
  phrase: string;
  description: string;
  action: CommandAction;
};

export const COMMAND_MAP: Record<string, { description: string; action: CommandAction }> =
  {
    "문의 보기": {
      description: "문의 목록 페이지로 이동",
      action: { type: "navigate", href: "/admin/inquiries" },
    },
    "새 사건 추가": {
      description: "사건 등록 페이지 열기",
      action: { type: "navigate", href: "/admin/cases" },
    },
    "오늘 일정": {
      description: "오늘 캘린더 보기",
      action: { type: "navigate", href: "/admin/calendar" },
    },
    "대시보드": {
      description: "관리자 홈으로 이동",
      action: { type: "navigate", href: "/admin" },
    },
    "사건 목록": {
      description: "사건 목록 보기",
      action: { type: "navigate", href: "/admin/cases" },
    },
    "통계": {
      description: "통계 및 재무 보기",
      action: { type: "navigate", href: "/admin/stats" },
    },
    "고객 목록": {
      description: "고객 CRM 보기",
      action: { type: "navigate", href: "/admin/crm" },
    },
    "이메일 템플릿": {
      description: "이메일 템플릿 관리",
      action: { type: "navigate", href: "/admin/email-templates" },
    },
    "도움말": {
      description: "사용 가능한 명령 안내",
      action: { type: "toast", message: "사용 가능한 명령을 화면에서 확인하세요." },
    },
    "새 문의 몇 건": {
      description: "오늘 들어온 새 문의 수",
      action: { type: "query", resource: "inquiries.today" },
    },
  };

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "").replace(/[.,?!]/g, "");
}

export function matchCommand(transcript: string): Command | null {
  const norm = normalize(transcript);
  let best: { phrase: string; score: number } | null = null;

  for (const phrase of Object.keys(COMMAND_MAP)) {
    const np = normalize(phrase);
    let score = 0;
    if (norm === np) score = 100;
    else if (norm.includes(np)) score = 80;
    else if (np.includes(norm) && norm.length >= 2) score = 60;
    else {
      // Token overlap
      const tokens = phrase.split(/\s+/);
      const hit = tokens.filter((t) => norm.includes(normalize(t))).length;
      if (hit > 0) score = (hit / tokens.length) * 50;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { phrase, score };
    }
  }

  if (!best || best.score < 40) return null;
  const entry = COMMAND_MAP[best.phrase];
  return { phrase: best.phrase, ...entry };
}

// ── 확장: 라우팅/검색 명령 파서 (voice-command-mic 컴포넌트에서 사용) ──

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export type VoiceAction =
  | { kind: "navigate"; path: string; label: string }
  | { kind: "search"; query: string; scope: "case" | "inquiry"; label: string }
  | { kind: "unknown"; reason: string };

export type ParsedCommand = {
  action: VoiceAction;
  params: Record<string, string>;
  source: "keyword" | "ai" | "map" | "none";
  confidence: number;
};

const CATEGORY_ALIASES: Record<string, string> = {
  비자: "VISA_STAY",
  체류: "VISA_STAY",
  귀화: "NATURALIZATION",
  법인: "CORPORATE_REQUEST",
  기업: "CORPORATE_REQUEST",
  민원: "GENERAL_ADMIN_CIVIL",
  이의: "ADMIN_APPEAL",
  이의신청: "ADMIN_APPEAL",
  행정심판: "ADMIN_APPEAL",
  아포스티유: "APOSTILLE_CONSULAR",
  영사: "APOSTILLE_CONSULAR",
};

function matchCategoryToken(text: string): string | null {
  for (const [alias, cat] of Object.entries(CATEGORY_ALIASES)) {
    if (text.includes(alias)) return cat;
  }
  return null;
}

function keywordParse(raw: string): ParsedCommand | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;

  if (/(지난주|저번주).*(마감|기한|deadline)/.test(text) || /마감.*지난주/.test(text)) {
    return {
      action: { kind: "navigate", path: "/admin/deadlines?filter=last_week", label: "지난주 마감 사건" },
      params: { filter: "last_week" },
      source: "keyword",
      confidence: 0.9,
    };
  }
  if (/(이번주).*(마감|기한|deadline)/.test(text)) {
    return {
      action: { kind: "navigate", path: "/admin/deadlines?filter=this_week", label: "이번주 마감 사건" },
      params: { filter: "this_week" },
      source: "keyword",
      confidence: 0.9,
    };
  }
  if (/(신규|새).*(의뢰|문의|inquiry)/.test(text)) {
    const cat = matchCategoryToken(text);
    const path = cat
      ? `/admin/inquiries?status=NEW&category=${encodeURIComponent(cat)}`
      : `/admin/inquiries?status=NEW`;
    return {
      action: { kind: "navigate", path, label: cat ? `신규 의뢰 (${cat})` : "신규 의뢰" },
      params: cat ? { status: "NEW", category: cat } : { status: "NEW" },
      source: "keyword",
      confidence: cat ? 0.9 : 0.75,
    };
  }
  if (/(재무|매출|정산).*(리포트|보고서|report)/.test(text) || /재무 리포트/.test(text)) {
    return {
      action: { kind: "navigate", path: "/admin/finance", label: "재무 리포트" },
      params: {},
      source: "keyword",
      confidence: 0.95,
    };
  }
  const caseMatch = raw.match(/([가-힣A-Za-z]{2,10})\s*(사건|건)\s*(상세|열람|보기)?/);
  if (caseMatch) {
    const name = caseMatch[1];
    if (name && !["오늘", "이번주", "지난주", "신규", "새로", "재무"].includes(name)) {
      return {
        action: { kind: "search", query: name, scope: "case", label: `${name} 사건 검색` },
        params: { q: name },
        source: "keyword",
        confidence: 0.7,
      };
    }
  }
  return null;
}

async function aiClassify(text: string): Promise<ParsedCommand | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const prompt = `You classify Korean voice commands for an administrative-agent admin console.
Return JSON only, no prose. Schema:
{ "kind": "navigate" | "search" | "unknown",
  "path": "/admin/...",
  "query": "...", "scope": "case" | "inquiry",
  "label": "짧은 한국어 설명",
  "confidence": 0.0-1.0 }

Available admin paths: /admin/inquiries, /admin/cases, /admin/deadlines, /admin/finance, /admin/dashboard, /admin/blog, /admin/ai-agent.

Voice input: "${text}"`;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.content?.[0]?.text ?? "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]);
    const confidence = typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5;
    const label = typeof parsed.label === "string" ? parsed.label : "음성 명령";

    if (parsed.kind === "navigate" && typeof parsed.path === "string" && parsed.path.startsWith("/admin/")) {
      return {
        action: { kind: "navigate", path: parsed.path, label },
        params: { path: parsed.path },
        source: "ai",
        confidence,
      };
    }
    if (parsed.kind === "search" && typeof parsed.query === "string") {
      const scope = parsed.scope === "case" ? "case" : "inquiry";
      return {
        action: { kind: "search", query: parsed.query, scope, label },
        params: { q: parsed.query },
        source: "ai",
        confidence,
      };
    }
    return {
      action: { kind: "unknown", reason: label },
      params: {},
      source: "ai",
      confidence,
    };
  } catch (err) {
    logger.warn("[voice-command] AI 분류 실패", err);
    return null;
  }
}

/** 텍스트 → 파싱된 명령. 키워드 → COMMAND_MAP → Claude Haiku 순 fallback. */
export async function parseVoiceCommand(text: string): Promise<ParsedCommand> {
  const kw = keywordParse(text);
  if (kw) return kw;

  // COMMAND_MAP fallback (navigate/toast/query 액션을 통합 스키마로 변환)
  const m = matchCommand(text);
  if (m && m.action.type === "navigate") {
    return {
      action: { kind: "navigate", path: m.action.href, label: m.description },
      params: {},
      source: "map",
      confidence: 0.6,
    };
  }

  const ai = await aiClassify(text);
  if (ai) return ai;

  return {
    action: { kind: "unknown", reason: "인식된 명령이 없습니다." },
    params: {},
    source: "none",
    confidence: 0,
  };
}
