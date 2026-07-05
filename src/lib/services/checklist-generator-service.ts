/**
 * 사건 체크리스트 자동 생성 서비스.
 *
 * 카테고리별 하드코딩 템플릿 + Claude Haiku 맞춤화.
 * 각 단계: 제목, 설명, dueDayOffset(접수/개시일 기준 D+N), 필요 서류.
 *
 * 저장은 SiteSetting `case.checklist.{caseId}` (JSON) 사용 — prisma migration 불필요.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  dueDayOffset: number;
  requiredDocuments: string[];
}

export interface Checklist {
  category: string;
  steps: ChecklistStep[];
  generatedAt: string;
  provider: "claude-haiku" | "template";
}

export interface StoredChecklistState {
  checklist: Checklist;
  doneIds: string[];
  updatedAt: string;
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

// ── 카테고리 템플릿 ─────────────────────────────────────────────

const TEMPLATES: Record<string, Omit<ChecklistStep, "id">[]> = {
  VISA_STAY: [
    { title: "여권·비자 사본 확보", description: "여권 전면과 현행 비자 스탬프 사본 수령", dueDayOffset: 0, requiredDocuments: ["여권 사본", "비자 사본"] },
    { title: "재직/재학 증빙 수집", description: "재직증명서 또는 재학증명서 등 체류 자격 증빙", dueDayOffset: 1, requiredDocuments: ["재직증명서", "사업자등록증(고용주)"] },
    { title: "체류자격 요건 매트릭스 점검", description: "F-2/D-10/E-7 등 목표 자격의 요건 대조표 작성", dueDayOffset: 2, requiredDocuments: [] },
    { title: "출입국사무소 예약", description: "HiKorea 방문 예약 확보", dueDayOffset: 3, requiredDocuments: [] },
    { title: "신청서 작성 및 초안 검토", description: "신청서·사유서 초안 작성 후 담당 행정사 검토", dueDayOffset: 5, requiredDocuments: ["신청서", "체류 사유서"] },
    { title: "수수료 납부 및 접수", description: "수수료 결제 후 서류 제출", dueDayOffset: 7, requiredDocuments: ["수수료 영수증"] },
    { title: "결과 통지 대기 및 후속 안내", description: "심사 결과 통지 후 고객 안내 및 후속 조치", dueDayOffset: 21, requiredDocuments: [] }
  ],
  ADMIN_APPEAL: [
    { title: "처분 통지서 원본 확보", description: "처분 문서와 송달 봉투 확보", dueDayOffset: 0, requiredDocuments: ["처분 통지서"] },
    { title: "제소기간 계산", description: "행정심판 청구기간(90일) 및 행정소송 제소기간(90일/1년) 계산", dueDayOffset: 0, requiredDocuments: [] },
    { title: "관련 법령·조항 정리", description: "처분 근거 법령과 관련 판례 확인", dueDayOffset: 2, requiredDocuments: [] },
    { title: "사실관계 인터뷰", description: "고객 인터뷰 후 사실관계 표 작성", dueDayOffset: 3, requiredDocuments: [] },
    { title: "증거자료 수집", description: "각종 통지·서류·사진·녹취 등 증거 확보", dueDayOffset: 5, requiredDocuments: ["증거 목록"] },
    { title: "청구서 초안 작성", description: "행정심판청구서 또는 소장 초안 작성", dueDayOffset: 8, requiredDocuments: ["청구서 초안"] },
    { title: "고객 검토 및 확정", description: "고객 검토 후 최종 확정", dueDayOffset: 10, requiredDocuments: [] },
    { title: "접수 및 사건번호 확보", description: "접수 완료 후 사건번호 통지", dueDayOffset: 12, requiredDocuments: ["접수증"] },
    { title: "재결·판결 준비", description: "심리기일 대비 준비서면 작성", dueDayOffset: 30, requiredDocuments: ["준비서면"] },
    { title: "결정문 수령 및 결과 안내", description: "결정문 수령 및 후속 절차 안내", dueDayOffset: 60, requiredDocuments: [] }
  ],
  LICENSE: [
    { title: "인허가 종류 확인", description: "필요한 인허가 종류 및 신고 vs 등록 vs 허가 구분", dueDayOffset: 0, requiredDocuments: [] },
    { title: "요건 정리", description: "결격사유·시설·자본 요건 대조", dueDayOffset: 1, requiredDocuments: [] },
    { title: "서류 수집", description: "법인등기부·재무제표·인력·시설 서류", dueDayOffset: 3, requiredDocuments: ["법인등기부등본", "재무제표", "임차계약서"] },
    { title: "신청서 작성", description: "신청서·사업계획서 초안", dueDayOffset: 5, requiredDocuments: ["신청서", "사업계획서"] },
    { title: "관할 기관 접수", description: "관할 기관 방문/전자 접수", dueDayOffset: 7, requiredDocuments: [] },
    { title: "보완 요청 대응", description: "보완 요청 시 신속 대응", dueDayOffset: 14, requiredDocuments: [] },
    { title: "허가증 수령", description: "허가증·등록증 수령 및 등본 보관", dueDayOffset: 30, requiredDocuments: ["허가증"] }
  ],
  CONTRACT: [
    { title: "당사자·목적물 확인", description: "당사자 신원과 목적물 확인", dueDayOffset: 0, requiredDocuments: ["당사자 신분증"] },
    { title: "선례·표준계약서 검토", description: "동종 계약 표준안 비교", dueDayOffset: 1, requiredDocuments: [] },
    { title: "핵심 조항 협상 포인트 정리", description: "가격·기한·해지·손해배상 조항 검토", dueDayOffset: 2, requiredDocuments: [] },
    { title: "초안 작성 및 검토", description: "계약서 초안 및 상대방 리뷰", dueDayOffset: 4, requiredDocuments: ["계약서 초안"] },
    { title: "체결·공증", description: "필요 시 공증까지 진행", dueDayOffset: 7, requiredDocuments: ["체결본"] }
  ],
  CORPORATE: [
    { title: "법인 형태 결정", description: "주식회사·유한책임회사 등 형태 선택", dueDayOffset: 0, requiredDocuments: [] },
    { title: "상호·목적·자본금 정리", description: "상호 유사여부 조회, 목적/자본금 결정", dueDayOffset: 1, requiredDocuments: [] },
    { title: "발기인·주주 서류 수령", description: "인감증명, 신분증", dueDayOffset: 2, requiredDocuments: ["인감증명서", "신분증"] },
    { title: "정관 작성 및 공증", description: "정관 작성 후 필요 시 공증", dueDayOffset: 4, requiredDocuments: ["정관"] },
    { title: "잔고증명 및 납입", description: "자본금 납입과 잔고증명 확보", dueDayOffset: 5, requiredDocuments: ["잔고증명서"] },
    { title: "법인 설립 등기", description: "관할 등기소 접수", dueDayOffset: 7, requiredDocuments: ["설립등기 신청서"] },
    { title: "사업자등록", description: "세무서 사업자등록", dueDayOffset: 9, requiredDocuments: ["사업자등록 신청서"] },
    { title: "4대보험·통장·인장 등록", description: "고용/산재/건강/국민연금, 법인통장·법인인감", dueDayOffset: 12, requiredDocuments: [] }
  ]
};

// Inquiry / CaseMatter category → template key
function pickTemplateKey(category: string | null | undefined, intakeCategory: string | null | undefined): keyof typeof TEMPLATES {
  const raw = `${category ?? ""} ${intakeCategory ?? ""}`.toUpperCase();
  if (/VISA|IMMIGRAT|STAY|비자|체류/.test(raw)) return "VISA_STAY";
  if (/APPEAL|행정심판|심판|소송|처분/.test(raw)) return "ADMIN_APPEAL";
  if (/LICENSE|PERMIT|허가|인허가|등록/.test(raw)) return "LICENSE";
  if (/CONTRACT|계약/.test(raw)) return "CONTRACT";
  if (/CORPORATE|CORP|법인|회사/.test(raw)) return "CORPORATE";
  return "ADMIN_APPEAL";
}

function templateToChecklist(key: keyof typeof TEMPLATES): Checklist {
  const template = TEMPLATES[key];
  return {
    category: key,
    steps: template.map((s, i) => ({ id: `${key}-${i + 1}`, ...s })),
    generatedAt: new Date().toISOString(),
    provider: "template"
  };
}

async function customizeWithClaude(
  apiKey: string,
  base: Checklist,
  caseTitle: string,
  caseSpecifics: string
): Promise<Checklist> {
  const prompt = `한국 행정사 사건의 단계별 체크리스트를 사안에 맞게 보강하세요.

기본 템플릿(카테고리: ${base.category}):
${base.steps.map((s, i) => `${i + 1}. ${s.title} (D+${s.dueDayOffset}) — ${s.description}`).join("\n")}

사건 제목: ${caseTitle}
사안 세부내용:
${caseSpecifics.slice(0, 2000)}

지침:
- 기본 단계는 유지하되, 사안에서 특별히 필요한 서류를 requiredDocuments 에 추가.
- 필요 시 사안 특유 단계를 최대 3개 추가 (dueDayOffset은 기존 흐름을 고려하여 설정).
- 총 단계 수는 5~15개 유지.

응답: JSON 배열만.
[
  {"id":"unique-key","title":"...","description":"...","dueDayOffset":0,"requiredDocuments":["..."]}
]`;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array in AI response");
  const parsed = JSON.parse(match[0]) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Expected array");

  const steps: ChecklistStep[] = parsed
    .map((raw, i): ChecklistStep | null => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as Record<string, unknown>;
      if (typeof r.title !== "string") return null;
      return {
        id: typeof r.id === "string" && r.id.trim() ? r.id.trim() : `${base.category}-ai-${i + 1}`,
        title: r.title.trim(),
        description: typeof r.description === "string" ? r.description : "",
        dueDayOffset: typeof r.dueDayOffset === "number" ? Math.max(0, Math.floor(r.dueDayOffset)) : 0,
        requiredDocuments: Array.isArray(r.requiredDocuments)
          ? (r.requiredDocuments as unknown[]).filter((x): x is string => typeof x === "string")
          : []
      };
    })
    .filter((s): s is ChecklistStep => s !== null)
    .slice(0, 15);

  if (steps.length < 3) throw new Error("Too few valid steps from AI");
  return {
    category: base.category,
    steps,
    generatedAt: new Date().toISOString(),
    provider: "claude-haiku"
  };
}

const settingKey = (caseId: string) => `case.checklist.${caseId}`;

export async function generateChecklist(caseId: string): Promise<Checklist> {
  const caseMatter = await prisma.caseMatter.findUnique({
    where: { id: caseId },
    select: {
      title: true,
      matterType: true,
      category: true,
      summary: true,
      internalMemo: true,
      inquiry: { select: { intakeCategory: true, description: true } }
    }
  });
  if (!caseMatter) throw new Error(`Case not found: ${caseId}`);

  const key = pickTemplateKey(String(caseMatter.category), caseMatter.inquiry?.intakeCategory ?? null);
  const base = templateToChecklist(key);

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return base;

  const specifics = [
    caseMatter.matterType,
    caseMatter.summary,
    caseMatter.internalMemo,
    caseMatter.inquiry?.description
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    return await customizeWithClaude(apiKey, base, caseMatter.title, specifics);
  } catch (err) {
    logger.warn("[checklist-generator] AI customization failed, using template", err);
    return base;
  }
}

export async function loadChecklistState(caseId: string): Promise<StoredChecklistState | null> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: settingKey(caseId) } });
  if (!setting) return null;
  try {
    const parsed = JSON.parse(setting.value) as StoredChecklistState;
    if (!parsed || !parsed.checklist || !Array.isArray(parsed.checklist.steps)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveChecklistState(
  caseId: string,
  checklist: Checklist,
  doneIds: string[]
): Promise<StoredChecklistState> {
  const state: StoredChecklistState = {
    checklist,
    doneIds: Array.from(new Set(doneIds)),
    updatedAt: new Date().toISOString()
  };
  await prisma.siteSetting.upsert({
    where: { key: settingKey(caseId) },
    create: { key: settingKey(caseId), value: JSON.stringify(state) },
    update: { value: JSON.stringify(state) }
  });
  return state;
}
