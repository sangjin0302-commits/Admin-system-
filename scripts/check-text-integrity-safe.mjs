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
  "src/app/admin/error.tsx",
  "src/app/admin/error-safe-v2.tsx",
  "src/app/admin/loading.tsx",
  "src/app/admin/loading-safe-v2.tsx",
  "src/app/admin/inquiries/loading.tsx",
  "src/app/admin/inquiries/loading-safe-v2.tsx",
  "src/app/admin/inquiries/[id]/loading.tsx",
  "src/app/admin/inquiries/[id]/loading-safe-v2.tsx",
  "src/app/intake/page.tsx",
  "src/app/intake/page-safe.tsx",
  "src/app/intake/error.tsx",
  "src/app/intake/error-safe-v2.tsx",
  "src/app/intake/loading.tsx",
  "src/app/intake/loading-safe-v2.tsx",
  "src/components/intake/copy-safe.ts",
  "src/components/intake/intake-form-safe.tsx",
  "src/app/api/inquiries/route.ts",
  "src/app/api/inquiries/route-safe.ts",
  "src/lib/validation/inquiry-safe.ts",
  "src/lib/validation/inquiry.ts",
  "src/lib/services/inquiry-service.ts"
];

const checks = [
  {
    name: "replacement-character",
    test: (text) => /\uFFFD/u.test(text),
    reason: "U+FFFD replacement character detected"
  },
  {
    name: "suspicious-string-literal-question-marks",
    test: (text) => /["'`][^"'`\n]*\?[^"'`\n]*\?[^"'`\n]*["'`]/u.test(text),
    reason: "suspicious repeated '?' detected in a string literal"
  },
  {
    name: "literal-unicode-escape-in-jsx-text",
    test: (text) => />[^<{]*\\u[0-9A-Fa-f]{4}[^<}]*</u.test(text),
    reason: "literal \\uXXXX sequence appears in JSX text node"
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
