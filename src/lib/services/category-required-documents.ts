/**
 * CaseMatterCategory 별 기본 RequiredDocument 템플릿.
 * 사건 카테고리 변경 / 생성 시 자동 시드.
 */

import { prisma } from "@/lib/prisma/client";

export type CategoryDocTemplate = {
  name: string;
  description?: string;
  required: boolean;
};

export const CATEGORY_DOCUMENT_TEMPLATES: Record<string, readonly CategoryDocTemplate[]> = {
  VISA_STAY: [
    { name: "여권 사본 (인적사항면)", required: true, description: "유효기간 6개월 이상 권장" },
    { name: "외국인등록증 사본", required: true },
    { name: "체류 자격 관련 증빙", required: true, description: "재직증명서, 사업자등록증, 재학증명서 등" },
    { name: "거주지 증빙", required: true, description: "임대차계약서, 가족관계 자료" },
    { name: "수수료 납부 증빙", required: true, description: "관청 신청 수수료" },
    { name: "표준 증명사진 (3.5x4.5cm)", required: true },
    { name: "이전 처분서 / 통지서", required: false, description: "해당 시" }
  ],
  ADMIN_APPEAL: [
    { name: "처분서 원본 또는 사본", required: true, description: "처분 일자·통지일 확인 가능 자료" },
    { name: "처분의 근거 자료", required: true, description: "조사보고서, 위반사실확인서 등" },
    { name: "청구인 신분증", required: true },
    { name: "반박 / 소명 자료", required: true, description: "사실관계를 다툴 수 있는 자료" },
    { name: "관련 계약서·증빙", required: false },
    { name: "이전 행정 절차 기록", required: false },
    { name: "증인 진술서", required: false }
  ],
  CONTRACT_INVESTIGATION: [
    { name: "기존 계약서 / 합의서", required: true },
    { name: "분쟁 관련 통신 기록", required: true, description: "문자, 이메일, 카카오톡 등" },
    { name: "사실관계 증빙", required: true, description: "사진, 영수증, 계좌 이체 내역" },
    { name: "관련 인허가 / 등록 자료", required: false },
    { name: "상대방 인적사항", required: false, description: "가능한 범위" },
    { name: "당사자 신분증", required: true }
  ],
  LICENSE_PERMIT: [
    { name: "사업자등록증 (또는 법인등기부등본)", required: true },
    { name: "허가 신청서 양식", required: true, description: "허가 관청 공식 양식" },
    { name: "사업장 임대차계약서 (또는 소유 증빙)", required: true },
    { name: "도면 / 시설 사진", required: false, description: "해당 시" },
    { name: "관련 자격증 / 면허증", required: false },
    { name: "환경·소방·위생 자료", required: false, description: "업종에 따라" },
    { name: "대표자 신분증", required: true }
  ],
  OTHER: [
    { name: "신청인 신분증", required: true },
    { name: "관련 사실관계 증빙", required: true },
    { name: "기본 신청 양식", required: true }
  ]
};

export function getCategoryDocumentTemplates(category: string): readonly CategoryDocTemplate[] {
  return CATEGORY_DOCUMENT_TEMPLATES[category] ?? CATEGORY_DOCUMENT_TEMPLATES.OTHER;
}

function normalizeKey(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * 사건에 카테고리 기본 체크리스트를 시드.
 * 이미 존재하는 같은 이름의 RequiredDocument는 skip.
 */
export async function seedCategoryRequiredDocuments(
  caseId: string,
  category: string
): Promise<{ created: number; skipped: number }> {
  const templates = getCategoryDocumentTemplates(category);
  const existing = await prisma.requiredDocument.findMany({
    where: { caseId },
    select: { name: true }
  });
  const existingKeys = new Set(existing.map((d) => normalizeKey(d.name)));

  const toCreate = templates.filter((t) => !existingKeys.has(normalizeKey(t.name)));
  if (toCreate.length === 0) return { created: 0, skipped: templates.length };

  await prisma.requiredDocument.createMany({
    data: toCreate.map((t) => ({
      caseId,
      name: t.name,
      description: t.description ?? null,
      required: t.required,
      status: "NEEDED" as never
    }))
  });

  return { created: toCreate.length, skipped: templates.length - toCreate.length };
}
