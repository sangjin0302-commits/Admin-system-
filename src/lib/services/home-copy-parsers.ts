/**
 * 홈페이지 마케팅 배열(benefits·whyCards·PHILOSOPHY·PROCESS_STEPS·PRACTICE_AREAS 등)을
 * admin(/admin/i18n, "home" 네임스페이스)에서 편집할 수 있도록, 각 배열을 한 개의
 * 여러 줄 문자열로 직렬화/역직렬화하는 순수 파서 모음.
 *
 * 직렬화 규칙:
 *   - 배열 = 줄 단위(한 줄 = 한 항목)
 *   - 객체 항목의 필드 = " :: "(공백-콜론콜론-공백)로 구분
 *   - 항목 안의 하위 목록(bullets) = "|" 로 구분
 *
 * ⚠️ 안전 원칙(BULLETPROOF): 모든 파서는 raw 가 비어있거나·없거나·형식이
 *    조금이라도 어긋나면(필드 수 불일치, 빈 값, 인덱스 정렬이 필요한데 줄 수가
 *    다름 등) 반드시 전달받은 fallback 배열을 "그대로" 돌려준다. 즉 override 가
 *    유효할 때만 override 를 쓰고, 아니면 하드코딩 기본값으로 회귀 → 홈이 절대
 *    깨지지 않는다.
 */

const FIELD = " :: ";
const SUB = "|";

/** 여러 줄 → 항목 배열(공백 라인 제거). */
function toLines(raw: string): string[] {
  return raw.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
}

/** 한 줄 = 한 문자열 항목. (benefits, leadBullets) */
export function parseStringList(raw: string | undefined, fallback: readonly string[]): string[] {
  if (!raw || !raw.trim()) return [...fallback];
  const items = toLines(raw);
  if (items.length === 0) return [...fallback];
  return items;
}

export type TitleDesc = { title: string; desc: string };

/** "title :: desc" 줄 단위. (whyCards) 인덱스 정렬 불필요 → 줄 수 자유. */
export function parseTitleDescList(
  raw: string | undefined,
  fallback: readonly TitleDesc[]
): TitleDesc[] {
  if (!raw || !raw.trim()) return [...fallback];
  const lines = toLines(raw);
  if (lines.length === 0) return [...fallback];
  const out: TitleDesc[] = [];
  for (const line of lines) {
    const parts = line.split(FIELD).map((p) => p.trim());
    if (parts.length !== 2 || !parts[0] || !parts[1]) return [...fallback];
    out.push({ title: parts[0], desc: parts[1] });
  }
  return out;
}

export type PhilosophyText = { title: string; description: string; benefit: string };

/**
 * "title :: desc :: benefit" 줄 단위. (PHILOSOPHY)
 * greek/korean 라벨과 순서를 인덱스로 매칭하므로 줄 수가 fallback 과 정확히
 * 같아야 한다(다르면 fallback).
 */
export function parsePhilosophyList(
  raw: string | undefined,
  fallback: readonly PhilosophyText[]
): PhilosophyText[] {
  if (!raw || !raw.trim()) return [...fallback];
  const lines = toLines(raw);
  if (lines.length !== fallback.length) return [...fallback];
  const out: PhilosophyText[] = [];
  for (const line of lines) {
    const parts = line.split(FIELD).map((p) => p.trim());
    if (parts.length !== 3 || parts.some((p) => !p)) return [...fallback];
    out.push({ title: parts[0], description: parts[1], benefit: parts[2] });
  }
  return out;
}

export type ProcessText = { step: string; title: string; desc: string };

/**
 * "step :: title :: desc" 줄 단위. (PROCESS_STEPS)
 * step 번호가 문자열 안에 포함되어 자기완결적 → 줄 수 자유.
 */
export function parseProcessList(
  raw: string | undefined,
  fallback: readonly ProcessText[]
): ProcessText[] {
  if (!raw || !raw.trim()) return [...fallback];
  const lines = toLines(raw);
  if (lines.length === 0) return [...fallback];
  const out: ProcessText[] = [];
  for (const line of lines) {
    const parts = line.split(FIELD).map((p) => p.trim());
    if (parts.length !== 3 || parts.some((p) => !p)) return [...fallback];
    out.push({ step: parts[0], title: parts[1], desc: parts[2] });
  }
  return out;
}

export type PracticeText = {
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
};

/**
 * "title :: subtitle :: description :: b1|b2|b3" 줄 단위. (PRACTICE_AREAS)
 * no/href/icon 을 인덱스로 매칭하므로 줄 수가 fallback 과 정확히 같아야 한다.
 * bullets 는 최소 1개 이상 필요.
 */
export function parsePracticeList(
  raw: string | undefined,
  fallback: readonly PracticeText[]
): PracticeText[] {
  if (!raw || !raw.trim()) return [...fallback];
  const lines = toLines(raw);
  if (lines.length !== fallback.length) return [...fallback];
  const out: PracticeText[] = [];
  for (const line of lines) {
    const parts = line.split(FIELD).map((p) => p.trim());
    if (parts.length !== 4) return [...fallback];
    const [title, subtitle, description, bulletsRaw] = parts;
    if (!title || !subtitle || !description || !bulletsRaw) return [...fallback];
    const bullets = bulletsRaw
      .split(SUB)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);
    if (bullets.length === 0) return [...fallback];
    out.push({ title, subtitle, description, bullets });
  }
  return out;
}
