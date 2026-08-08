/**
 * 텍스트 무결성 검사 — 한글 mojibake(깨진 인코딩)·U+FFFD·의심 문자열을 잡는다.
 *
 * src/ 와 middleware.ts 를 재귀 스캔한다. 예전에는 고정 파일 목록(CHECK_TARGETS)을
 * 훑는 구현이 위쪽에 있었지만, 목록이 실제 파일과 어긋나도(삭제된 파일이 남아도)
 * 아무도 눈치채지 못한 채 통째로 주석 처리돼 죽어 있었다 — 지금은 스캔 방식만 남긴다.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_ROOTS = ["middleware.ts", "src"];
const EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".mjs"]);
const EXCLUDED_DIR_NAMES = new Set(["node_modules", ".next", ".git", "generated", "prisma"]);
const EXCLUDED_FILE_PATTERNS = [/\.legacy\./u];

const KNOWN_MOJIBAKE_FRAGMENTS = [
  "?쒖",
  "?묒닔",
  "?댁쁺",
  "?붿껌",
  "?낅젰",
  "遺덈윭",
  "紐삵"
];

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function shouldExcludeFile(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(normalized));
}

async function collectScanTargets(entryPath) {
  const absolutePath = path.join(ROOT, entryPath);
  const targets = [];

  let entryStat;
  try {
    entryStat = await stat(absolutePath);
  } catch {
    return targets;
  }

  if (entryStat.isFile()) {
    const ext = path.extname(absolutePath).toLowerCase();
    if (EXTENSIONS.has(ext) && !shouldExcludeFile(rel(absolutePath))) {
      targets.push(rel(absolutePath));
    }
    return targets;
  }

  if (!entryStat.isDirectory()) return targets;

  const queue = [absolutePath];
  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) continue;

    const children = await readdir(current, { withFileTypes: true });
    for (const child of children) {
      const childPath = path.join(current, child.name);
      if (child.isDirectory()) {
        if (EXCLUDED_DIR_NAMES.has(child.name)) continue;
        queue.push(childPath);
        continue;
      }

      if (!child.isFile()) continue;
      const ext = path.extname(child.name).toLowerCase();
      if (!EXTENSIONS.has(ext)) continue;
      const relativePath = rel(childPath);
      if (shouldExcludeFile(relativePath)) continue;
      targets.push(relativePath);
    }
  }

  return targets;
}

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function extractStringLiterals(text) {
  const literals = [];
  const regex = /(["'])(?:\\.|(?!\1)[^\\\r\n])*\1/gu;
  let match = regex.exec(text);
  while (match) {
    literals.push(match[0]);
    match = regex.exec(text);
  }
  return literals;
}

function decodeLiteral(literal) {
  if (literal.length < 2) return "";
  return literal.slice(1, -1);
}

function hasSuspiciousMojibakeInLiteral(literalBody) {
  if (/\uFFFD/u.test(literalBody)) return "U+FFFD replacement character detected in string literal";
  if (/^\?[^\x00-\x7F]/u.test(literalBody)) {
    return "string literal starts with '?' followed by non-ASCII text";
  }
  if (/\?[ㄱ-ㅎㅏ-ㅣ가-힣]/u.test(literalBody)) {
    return "string literal includes suspicious '? + Hangul' sequence";
  }
  if (/\?{2,}/u.test(literalBody) && /[ㄱ-ㅎㅏ-ㅣ가-힣\u4E00-\u9FFF]/u.test(literalBody)) {
    return "string literal includes repeated '?' near CJK/Hangul characters";
  }

  for (const fragment of KNOWN_MOJIBAKE_FRAGMENTS) {
    if (literalBody.includes(fragment)) {
      return `known mojibake fragment detected: ${fragment}`;
    }
  }

  return null;
}

function runContentChecks(text) {
  const failures = [];
  const activeText = stripComments(text);

  if (/\uFFFD/u.test(activeText)) {
    failures.push("U+FFFD replacement character detected");
  }

  if (/[\u4E00-\u9FFF][\uAC00-\uD7A3]|[\uAC00-\uD7A3][\u4E00-\u9FFF]/u.test(activeText)) {
    failures.push("possible mojibake pattern (CJK/Hangul mixed sequence) detected");
  }

  for (const literal of extractStringLiterals(activeText)) {
    const reason = hasSuspiciousMojibakeInLiteral(decodeLiteral(literal));
    if (reason) {
      failures.push(reason);
      break;
    }
  }

  return failures;
}

async function run() {
  const failures = [];
  const discoveredTargets = new Set();

  for (const root of SCAN_ROOTS) {
    const targets = await collectScanTargets(root);
    for (const target of targets) {
      discoveredTargets.add(target);
    }
  }

  const checkTargets = Array.from(discoveredTargets).sort();

  for (const target of checkTargets) {
    const fullPath = path.join(ROOT, target);

    let text;
    try {
      text = await readFile(fullPath, "utf8");
    } catch (error) {
      failures.push({
        file: target,
        reason: `file read failed: ${error instanceof Error ? error.message : String(error)}`
      });
      continue;
    }

    const contentFailures = runContentChecks(text);
    for (const reason of contentFailures) {
      failures.push({
        file: rel(fullPath),
        reason
      });
    }
  }

  if (failures.length > 0) {
    console.error("[text-integrity] FAILED");
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.reason}`);
    }
    process.exit(1);
  }

  console.log(`[text-integrity] OK (${checkTargets.length} files checked)`);
}

await run();
