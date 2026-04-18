/*
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

const CHECK_TARGETS = [
  "middleware.ts",
  "src/app/layout.tsx",
  "src/app/root-layout-safe.tsx",
  "src/components/layout/app-shell-safe.tsx",
  "src/app/error.tsx",
  "src/app/error-safe-v2.tsx",
  "src/app/global-error.tsx",
  "src/app/admin/error.tsx",
  "src/app/admin/error-safe-v2.tsx",
  "src/app/admin/loading.tsx",
  "src/app/admin/loading-safe-v2.tsx",
  "src/app/admin/inquiries/loading.tsx",
  "src/app/admin/inquiries/loading-safe-v2.tsx",
  "src/app/admin/inquiries/[id]/loading.tsx",
  "src/app/admin/inquiries/[id]/loading-safe-v2.tsx",
  "src/app/admin/monitoring/page-safe-v3.tsx",
  "src/app/admin/monitoring/page-safe-v4.tsx",
  "src/app/intake/page.tsx",
  "src/app/intake/page-safe.tsx",
  "src/app/intake/error.tsx",
  "src/app/intake/error-safe-v2.tsx",
  "src/app/intake/loading.tsx",
  "src/app/intake/loading-safe-v2.tsx",
  "src/app/page-admin-redirect.tsx",
  "src/components/intake/copy-safe.ts",
  "src/components/intake/intake-form-safe-v3.tsx",
  "src/components/admin-status-form.tsx",
  "src/components/admin/inquiry-operational-summary.tsx",
  "src/components/admin/workflow-progress-panel-safe-v3.tsx",
  "src/components/admin/inquiry-execution-playbook-safe-v3.tsx",
  "src/components/admin/inquiry-decision-board.tsx",
  "src/components/admin/inquiry-communication-log-panel.tsx",
  "src/components/admin/lawbot-case-analysis-panel.tsx",
  "src/components/admin/admin-ops-banner.tsx",
  "src/components/admin/public-intake-control-card.tsx",
  "src/components/admin/quote-workspace.tsx",
  "src/app/admin/inquiries/[id]/page.tsx",
  "src/app/api/inquiries/route.ts",
  "src/app/api/inquiries/route-safe-v3.ts",
  "src/app/api/admin/system/health/route-safe-v2.ts",
  "src/app/api/admin/system/intake-control/route-safe-v2.ts",
  "src/app/api/admin/system/health/route-safe.ts",
  "src/app/api/admin/marketing/ingest/route.ts",
  "src/lib/validation/inquiry-safe.ts",
  "src/lib/validation/inquiry.ts",
  "src/lib/http/client-api.ts",
  "src/lib/services/inquiry-service.ts",
  "src/lib/services/marketing-sync-service.ts",
  "src/lib/services/public-intake-control-service-safe-v3.ts",
  "src/lib/services/system-health-service-safe.ts",
  "src/lib/services/system-health-service-safe-v2.ts"
];

const checks = [
  {
    name: "replacement-character",
    test: (text) => /\uFFFD/u.test(text),
    reason: "U+FFFD replacement character detected"
  },
  {
    name: "suspicious-string-literal-triple-question-marks",
    test: (text) => /["'`][^"'`\n]*\?\?\?[^"'`\n]*["'`]/u.test(text),
    reason: "suspicious '???' sequence detected in a string literal"
  },
  {
    name: "literal-unicode-escape-in-jsx-text",
    test: (text) => />[^<{]*\\u[0-9A-Fa-f]{4}[^<}]*</u.test(text),
    reason: "literal \\uXXXX sequence appears in JSX text node"
  },
  {
    name: "possible-mojibake-cjk-hangul-mix",
    test: (text) => /[\u4E00-\u9FFF][\uAC00-\uD7A3]|[\uAC00-\uD7A3][\u4E00-\u9FFF]/u.test(text),
    reason: "possible mojibake pattern (CJK/Hangul mixed sequence) detected"
  },
  {
    name: "possible-mojibake-question-mark-prefix",
    test: (text) => /\?[ㄱ-ㅎㅏ-ㅣ가-힣]/u.test(text),
    reason: "possible mojibake pattern ('?' before Hangul) detected"
  },
  {
    name: "possible-mojibake-known-fragments",
    test: (text) => /湲곕낯|寃곌낵|吏꾪뻾|\?곷떞|\?묒닔/u.test(text),
    reason: "known mojibake fragment detected"
  },
  {
    name: "possible-mojibake-double-question-in-string-literal",
    test: (text) => /["'][^"'\n]*[가-힣一-龥][^"'\n]*\?\?[^"'\n]*["']/u.test(text),
    reason: "possible mojibake pattern ('??' inside localized string literal) detected"
  },
  {
    name: "possible-mojibake-leading-question-in-localized-string",
    test: (text) => /["']\?[^"'\n]*[가-힣一-龥][^"'\n]*["']/u.test(text),
    reason: "possible mojibake pattern ('?' leading localized string literal) detected"
  }
];

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

async function run() {
  const failures = [];

  for (const target of CHECK_TARGETS) {
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

    for (const check of checks) {
      if (check.test(text)) {
        failures.push({
          file: rel(fullPath),
          reason: check.reason
        });
      }
    }
  }

  if (failures.length > 0) {
    console.error("[text-integrity] FAILED");
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.reason}`);
    }
    process.exit(1);
  }

  console.log(`[text-integrity] OK (${CHECK_TARGETS.length} files checked)`);
}

await run();
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
