/**
 * 문서 서식(템플릿) 관리 — 관리자가 만든 Google Docs 서식을 등록해두고,
 * 사건 데이터로 플레이스홀더({{키}})를 채워 복사본을 찍어낸다.
 *
 * 저장소: SiteSetting (key = `doc.template.{slug}`, value = JSON).
 * 별도 테이블 없이 기존 key-value 스토어 재사용.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const PREFIX = "doc.template.";

export interface DocTemplate {
  slug: string;
  name: string;
  templateDocId: string;
  variables: string[];
  createdAt: string;
}

/** 사건 데이터에서 뽑아 쓸 수 있는 표준 변수 목록(서식 작성 안내용). */
export const STANDARD_VARIABLES: { key: string; desc: string }[] = [
  { key: "사건번호", desc: "사건 번호 (caseNo)" },
  { key: "사건명", desc: "사건 제목" },
  { key: "분야", desc: "practice area category" },
  { key: "업무유형", desc: "matterType" },
  { key: "의뢰인", desc: "CLIENT 당사자 이름" },
  { key: "의뢰인연락처", desc: "CLIENT 전화" },
  { key: "의뢰인이메일", desc: "CLIENT 이메일" },
  { key: "의뢰인주소", desc: "CLIENT 소속/조직" },
  { key: "국적", desc: "CLIENT 국적" },
  { key: "신청인", desc: "APPLICANT 이름(있으면)" },
  { key: "보호자", desc: "GUARDIAN 이름(있으면)" },
  { key: "고용주", desc: "EMPLOYER 이름(있으면)" },
  { key: "수임인", desc: "행정사 ETHOS (고정)" },
  { key: "작성일", desc: "오늘 날짜 YYYY-MM-DD" },
  { key: "요약", desc: "사건 요약" }
];

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `t${Date.now().toString(36)}`;
}

/** 등록된 모든 템플릿을 반환(최근 등록 우선). */
export async function listTemplates(): Promise<DocTemplate[]> {
  const rows = await prisma.siteSetting
    .findMany({ where: { key: { startsWith: PREFIX } } })
    .catch(() => []);
  const out: DocTemplate[] = [];
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.value) as DocTemplate;
      if (parsed?.templateDocId && parsed?.slug) out.push(parsed);
    } catch {
      logger.warn("[doc-template] bad JSON in", row.key);
    }
  }
  return out.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function getTemplate(slug: string): Promise<DocTemplate | null> {
  const row = await prisma.siteSetting
    .findUnique({ where: { key: `${PREFIX}${slug}` } })
    .catch(() => null);
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as DocTemplate;
  } catch {
    return null;
  }
}

/**
 * 템플릿 등록/수정. templateDocId 는 관리자가 만든 Google Docs 문서 ID.
 * variables 는 문서에서 추출한 {{키}} 목록(없으면 빈 배열).
 */
export async function registerTemplate(params: {
  name: string;
  templateDocId: string;
  variables?: string[];
  slug?: string;
}): Promise<DocTemplate> {
  const slug = params.slug?.trim() || slugify(params.name);
  const tpl: DocTemplate = {
    slug,
    name: params.name.trim() || slug,
    templateDocId: params.templateDocId.trim(),
    variables: params.variables ?? [],
    createdAt: new Date().toISOString()
  };
  const value = JSON.stringify(tpl);
  await prisma.siteSetting.upsert({
    where: { key: `${PREFIX}${slug}` },
    create: { key: `${PREFIX}${slug}`, value },
    update: { value }
  });
  return tpl;
}

export async function deleteTemplate(slug: string): Promise<void> {
  await prisma.siteSetting
    .delete({ where: { key: `${PREFIX}${slug}` } })
    .catch(() => null);
}

/**
 * Google Docs 공유 URL 또는 문서 ID 문자열에서 documentId 를 추출.
 * 형식: https://docs.google.com/document/d/<ID>/edit
 */
export function parseDocId(input: string): string | null {
  const s = input.trim();
  const m = s.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // 이미 ID 만 넣은 경우(영숫자·_-, 20자 이상)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s;
  return null;
}

/** 사건 데이터 → 플레이스홀더 치환 맵. */
export function buildReplacements(cm: {
  caseNo: string | null;
  title: string;
  matterType: string;
  category: string;
  summary: string | null;
  parties: { role: string; name: string; phone?: string | null; email?: string | null; organization?: string | null; nationality?: string | null }[];
}): Record<string, string> {
  const byRole = (role: string) => cm.parties.find((p) => p.role === role);
  const client = byRole("CLIENT");
  const today = new Date().toISOString().slice(0, 10);
  return {
    사건번호: cm.caseNo ?? "-",
    사건명: cm.title ?? "",
    분야: cm.category ?? "",
    업무유형: cm.matterType ?? "",
    의뢰인: client?.name ?? "(의뢰인)",
    의뢰인연락처: client?.phone ?? "",
    의뢰인이메일: client?.email ?? "",
    의뢰인주소: client?.organization ?? "",
    국적: client?.nationality ?? "",
    신청인: byRole("APPLICANT")?.name ?? "",
    보호자: byRole("GUARDIAN")?.name ?? "",
    고용주: byRole("EMPLOYER")?.name ?? "",
    수임인: "행정사 ETHOS",
    작성일: today,
    요약: cm.summary?.trim() ?? ""
  };
}
