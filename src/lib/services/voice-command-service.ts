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
