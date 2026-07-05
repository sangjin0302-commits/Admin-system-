/**
 * 자기 문서화 서비스 — FEATURE_REGISTRY, SiteSetting 키, 주요 환경 변수를
 * 마크다운으로 자동 생성하여 public/docs/ 에 저장.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { FEATURE_REGISTRY } from "@/lib/services/feature-flags-service";
import { SITE_SETTINGS_DEFAULTS } from "@/lib/services/site-settings";
import { logger } from "@/lib/utils/logger";

export type DocCategory = "feature" | "config" | "env";

export type GeneratedDoc = {
  category: DocCategory;
  title: string;
  markdown: string;
  path: string;
  bytes: number;
};

/** 문서 생성 시 참조하는 주요 환경 변수 목록 (하드코딩 정적 스캔 대체). */
const KNOWN_ENV_VARS: Array<{ key: string; description: string; required: boolean }> = [
  { key: "DATABASE_URL", description: "PostgreSQL 접속 URL (prisma)", required: true },
  { key: "CRON_SECRET", description: "Vercel Cron 인증 Bearer 시크릿", required: true },
  { key: "ANTHROPIC_API_KEY", description: "Claude AI 호출 키", required: true },
  { key: "OPENAI_API_KEY", description: "OpenAI 호출 키 (선택)", required: false },
  { key: "SENTRY_DSN", description: "Sentry 오류 전송 DSN", required: false },
  { key: "KAKAO_ALIMTALK_TOKEN", description: "카카오 알림톡 발송 토큰", required: false },
  { key: "NAVER_ADS_API_KEY", description: "네이버 광고 API 키 (자율 마케팅)", required: false },
  { key: "GOOGLE_ADS_OAUTH_TOKEN", description: "Google Ads OAuth 토큰 (자율 마케팅)", required: false },
];

function featuresMarkdown(): string {
  const byCat = new Map<string, typeof FEATURE_REGISTRY[number][]>();
  for (const f of FEATURE_REGISTRY) {
    const arr = byCat.get(f.category) ?? [];
    arr.push(f);
    byCat.set(f.category, arr);
  }
  const lines: string[] = [];
  lines.push("# 기능 플래그 (Feature Flags)");
  lines.push("");
  lines.push(`_자동 생성됨: ${new Date().toISOString()}_`);
  lines.push("");
  lines.push(`총 ${FEATURE_REGISTRY.length}개 기능 등록됨.`);
  lines.push("");
  for (const [cat, list] of byCat.entries()) {
    lines.push(`## ${cat}`);
    lines.push("");
    lines.push("| 키 | 이름 | 기본값 | 공개 | 설명 |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const f of list) {
      const def = f.default ? "ON" : "OFF";
      const pub = f.public ? "예" : "-";
      const desc = (f.description ?? "").replace(/\|/g, "\\|");
      lines.push(`| \`${f.key}\` | ${f.label} | ${def} | ${pub} | ${desc} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function configMarkdown(): string {
  const lines: string[] = [];
  lines.push("# 사이트 설정 (SiteSetting)");
  lines.push("");
  lines.push(`_자동 생성됨: ${new Date().toISOString()}_`);
  lines.push("");
  lines.push("| 키 | 기본값 |");
  lines.push("| --- | --- |");
  for (const [key, val] of Object.entries(SITE_SETTINGS_DEFAULTS)) {
    const v = val ? val.slice(0, 80).replace(/\|/g, "\\|").replace(/\n/g, " ") : "_(빈값)_";
    lines.push(`| \`${key}\` | ${v} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function envMarkdown(): string {
  const lines: string[] = [];
  lines.push("# 환경 변수");
  lines.push("");
  lines.push(`_자동 생성됨: ${new Date().toISOString()}_`);
  lines.push("");
  lines.push("| 키 | 필수 | 설명 | 상태 |");
  lines.push("| --- | --- | --- | --- |");
  for (const e of KNOWN_ENV_VARS) {
    const set = process.env[e.key] ? "설정됨" : "-";
    const req = e.required ? "필수" : "선택";
    lines.push(`| \`${e.key}\` | ${req} | ${e.description} | ${set} |`);
  }
  lines.push("");
  return lines.join("\n");
}

async function writeDoc(category: DocCategory, markdown: string, title: string): Promise<GeneratedDoc> {
  const dir = path.join(process.cwd(), "public", "docs");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${category}.md`);
  await fs.writeFile(filePath, markdown, "utf-8");
  return {
    category,
    title,
    markdown,
    path: `/docs/${category}.md`,
    bytes: Buffer.byteLength(markdown, "utf-8"),
  };
}

export async function regenerateDocs(): Promise<GeneratedDoc[]> {
  try {
    const results = await Promise.all([
      writeDoc("feature", featuresMarkdown(), "기능 플래그"),
      writeDoc("config", configMarkdown(), "사이트 설정"),
      writeDoc("env", envMarkdown(), "환경 변수"),
    ]);
    logger.debug("[self-docs] regenerated", { count: results.length });
    return results;
  } catch (err) {
    logger.debug("[self-docs] regenerate failed", { err: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

export async function readGeneratedDoc(category: DocCategory): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "docs", `${category}.md`);
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export function previewDocs(): Record<DocCategory, string> {
  return {
    feature: featuresMarkdown(),
    config: configMarkdown(),
    env: envMarkdown(),
  };
}
