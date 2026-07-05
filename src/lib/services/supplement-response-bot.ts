/**
 * 기관 보완 요청 대응 서면 자동 초안 봇.
 *
 * 입력: (1) 보완 요청 텍스트, (2) 원본 사건(CaseMatter) 정보.
 * 출력: 답변 초안(조항 근거·논지·필요 서류·서명 블록 포함).
 *
 * Claude Haiku 사용. ANTHROPIC_API_KEY 미설정 시 규칙 기반 폴백.
 * lawbot 검색 결과가 있으면 근거 조문·판례를 프롬프트에 삽입.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export interface SupplementDraft {
  subject: string;
  body: string;
  citedProvisions: string[];
  requiredDocuments: string[];
  signatureBlock: string;
  provider: "claude-haiku" | "fallback";
  warnings: string[];
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

interface CaseSummary {
  caseNo: string | null;
  title: string;
  matterType: string;
  category: string;
  summary: string | null;
  status: string;
  applicantName: string | null;
  targetAgency: string | null;
}

async function loadCaseSummary(caseId: string): Promise<CaseSummary | null> {
  const c = await prisma.caseMatter.findUnique({
    where: { id: caseId },
    select: {
      caseNo: true,
      title: true,
      matterType: true,
      category: true,
      summary: true,
      status: true,
      inquiry: {
        select: { contactName: true, targetAgency: true }
      }
    }
  });
  if (!c) return null;
  return {
    caseNo: c.caseNo,
    title: c.title,
    matterType: c.matterType,
    category: String(c.category),
    summary: c.summary,
    status: String(c.status),
    applicantName: c.inquiry?.contactName ?? null,
    targetAgency: c.inquiry?.targetAgency ?? null
  };
}

function fallbackDraft(caseInfo: CaseSummary, requestText: string): SupplementDraft {
  const applicant = caseInfo.applicantName ?? "신청인";
  const agency = caseInfo.targetAgency ?? "귀 기관";
  const truncated = requestText.trim().slice(0, 240);
  return {
    subject: `[보완서 제출] ${caseInfo.title}${caseInfo.caseNo ? ` (사건번호 ${caseInfo.caseNo})` : ""}`,
    body: `${agency} 담당자님,\n\n신청인 ${applicant}은(는) 귀 기관의 보완 요청(요지: ${truncated})에 대하여 아래와 같이 답변드립니다.\n\n1. 요청 사항에 대한 사실관계 정리\n   - 사안 개요: ${caseInfo.summary ?? caseInfo.title}\n   - 현재 상태: ${caseInfo.status}\n\n2. 관련 조항 근거\n   - 관련 조문은 별지 목록을 참조하십시오.\n\n3. 추가 제출 서류\n   - 요청하신 자료를 첨부하여 제출합니다.\n\n감사합니다.`,
    citedProvisions: [],
    requiredDocuments: ["보완 요청서 원본", "관련 증빙 서류 사본", "위임장(원본)"],
    signatureBlock: `대리인 행정사 (인)\n연락처: -`,
    provider: "fallback",
    warnings: ["ANTHROPIC_API_KEY 미설정 — 규칙 기반 폴백 초안입니다. 반드시 담당자가 검토·수정 후 제출하세요."]
  };
}

async function searchLawbotContext(query: string): Promise<string[]> {
  // Best-effort: 실제 lawbot bridge가 검색 엔드포인트를 제공하지 않을 수 있으므로
  // 실패 시 빈 배열로 폴백. 프롬프트 보강용 컨텍스트일 뿐이라 필수는 아님.
  try {
    const baseUrl = process.env.LAWBOT_BRIDGE_BASE_URL;
    const key = process.env.LAWBOT_SERVICE_KEY;
    if (!baseUrl || !key) return [];
    const url = `${baseUrl.replace(/\/$/, "")}/api/v1/search?q=${encodeURIComponent(query.slice(0, 120))}&limit=3`;
    const res = await fetch(url, {
      headers: { "X-Service-Key": key, "X-Service-Caller": process.env.LAWBOT_SERVICE_CALLER ?? "admin-supplement-bot" },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: Array<{ title?: string; snippet?: string }> };
    return (data.results ?? [])
      .map((r) => [r.title, r.snippet].filter(Boolean).join(" — "))
      .filter((s) => s.length > 0)
      .slice(0, 3);
  } catch {
    return [];
  }
}

function buildPrompt(caseInfo: CaseSummary, requestText: string, lawbotContext: string[]): string {
  return `당신은 한국 행정사가 기관 보완 요청에 대응하기 위한 답변 서면 초안을 작성하는 전문가입니다.

사건 정보:
- 제목: ${caseInfo.title}
- 사건번호: ${caseInfo.caseNo ?? "(미부여)"}
- 유형: ${caseInfo.matterType} / ${caseInfo.category}
- 신청인: ${caseInfo.applicantName ?? "(불명)"}
- 대상 기관: ${caseInfo.targetAgency ?? "(불명)"}
- 요약: ${caseInfo.summary ?? "(없음)"}
- 현재 상태: ${caseInfo.status}

기관의 보완 요청 원문:
"""
${requestText.trim().slice(0, 4000)}
"""

참고 자료(lawbot 검색 결과, 있을 경우):
${lawbotContext.length ? lawbotContext.map((c, i) => `- (${i + 1}) ${c}`).join("\n") : "- (없음)"}

작성 지침:
- 존댓말, 관공서 제출용 정중한 서면 톤.
- 요청 사항 하나하나에 대해 사실관계 정리 → 근거 조항 → 조치 내용 순으로 서술.
- 근거 조문은 정확히 파악되는 것만 인용(불명확 시 인용하지 말 것).
- 필요 서류 목록은 실제로 사안에 필요한 것만 나열.

응답은 JSON으로만 답하세요:
{
  "subject": "제목",
  "body": "본문 (여러 문단, \\n 줄바꿈)",
  "citedProvisions": ["예: 출입국관리법 제10조 제2항"],
  "requiredDocuments": ["첨부 서류 목록"],
  "signatureBlock": "대리인 서명 블록"
}`;
}

async function generateWithClaude(
  apiKey: string,
  caseInfo: CaseSummary,
  requestText: string,
  lawbotContext: string[]
): Promise<SupplementDraft> {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: buildPrompt(caseInfo, requestText, lawbotContext) }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in AI response");
  const parsed = JSON.parse(match[0]) as Partial<SupplementDraft>;

  return {
    subject: typeof parsed.subject === "string" ? parsed.subject.trim() : `[보완서 제출] ${caseInfo.title}`,
    body: typeof parsed.body === "string" ? parsed.body.trim() : "",
    citedProvisions: Array.isArray(parsed.citedProvisions)
      ? parsed.citedProvisions.filter((s): s is string => typeof s === "string").slice(0, 20)
      : [],
    requiredDocuments: Array.isArray(parsed.requiredDocuments)
      ? parsed.requiredDocuments.filter((s): s is string => typeof s === "string").slice(0, 20)
      : [],
    signatureBlock: typeof parsed.signatureBlock === "string" ? parsed.signatureBlock.trim() : "대리인 행정사 (인)",
    provider: "claude-haiku",
    warnings: []
  };
}

export async function draftSupplementResponse(
  caseId: string,
  requestText: string
): Promise<SupplementDraft> {
  if (!requestText || requestText.trim().length < 5) {
    throw new Error("보완 요청 텍스트가 너무 짧습니다.");
  }
  const caseInfo = await loadCaseSummary(caseId);
  if (!caseInfo) {
    throw new Error(`Case not found: ${caseId}`);
  }

  const lawbotContext = await searchLawbotContext(`${caseInfo.title} ${requestText}`);
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    logger.info("[supplement-bot] ANTHROPIC_API_KEY unset — using fallback template");
    return fallbackDraft(caseInfo, requestText);
  }

  try {
    return await generateWithClaude(apiKey, caseInfo, requestText, lawbotContext);
  } catch (err) {
    logger.warn("[supplement-bot] Claude generation failed, falling back", err);
    return fallbackDraft(caseInfo, requestText);
  }
}
