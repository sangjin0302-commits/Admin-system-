/**
 * JJJ2 — 이메일 템플릿 변수 치환 렌더러.
 *
 * `renderTemplate(templateKey, variables)` → { subject, html }
 * SiteSetting에 저장된 커스텀 템플릿을 조회 후 {{var}} 자리표시자를 치환한다.
 */

import {
  DEFAULT_TEMPLATES,
  getTemplate,
  renderTemplate as renderTemplateObject,
} from "@/lib/services/email-template-service";

export type RenderedEmail = { subject: string; html: string };

export const SAMPLE_VARIABLES: Record<string, string> = {
  name: "홍길동",
  title: "부동산 명의이전 문의",
  caseNo: "ETHOS-2026-001",
  trackingCode: "TRK-ABCD-1234",
  amount: "1,500,000",
  link: "https://ethosattorney.com/portal/case/ETHOS-2026-001",
  date: new Date().toISOString().slice(0, 10),
  assignee: "김담당",
  message: "다음 단계로 관할 관청 접수 진행 중입니다.",
};

/** 템플릿 키와 변수 맵으로 최종 subject/html 을 렌더링. */
export async function renderTemplate(
  templateKey: string,
  variables: Record<string, string | number | undefined | null> = {},
): Promise<RenderedEmail> {
  if (!DEFAULT_TEMPLATES[templateKey]) {
    throw new Error(`Unknown template key: ${templateKey}`);
  }
  const template = await getTemplate(templateKey);
  const stringVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(variables)) {
    if (v === undefined || v === null) continue;
    stringVars[k] = String(v);
  }
  return renderTemplateObject(template, stringVars);
}

/** 미리보기용 — 실제 변수를 채우거나 없는 자리는 샘플로 대체. */
export async function renderTemplatePreview(
  templateKey: string,
  overrides: Record<string, string> = {},
): Promise<RenderedEmail> {
  const merged: Record<string, string> = { ...SAMPLE_VARIABLES, ...overrides };
  return renderTemplate(templateKey, merged);
}
