import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { getRenderedSchemaPath, normalizeProvider, renderPrismaSchema } from "./render-prisma-schema.mjs";

const MAX_GENERATE_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableFailure(output) {
  return /(EPERM|EBUSY|EACCES|operation not permitted|resource busy|rename)/i.test(output);
}

async function main() {
  const provider = normalizeProvider(process.env.PRISMA_DB_PROVIDER);
  const rootDir = process.cwd();
  const prismaCliPath = path.join(rootDir, "node_modules", "prisma", "build", "index.js");
  const strictMode = process.env.PRISMA_GENERATE_STRICT === "1";
  const fallbackClientPath = path.join(rootDir, "generated", "prisma-client-next", "client.ts");

  await renderPrismaSchema(provider);

  const schemaPath = getRenderedSchemaPath(rootDir, provider);
  let lastStatus = 1;
  let lastCombinedOutput = "";

  for (let attempt = 1; attempt <= MAX_GENERATE_ATTEMPTS; attempt += 1) {
    const result = spawnSync(process.execPath, [prismaCliPath, "generate", "--schema", schemaPath], {
      cwd: rootDir,
      env: process.env,
      encoding: "utf8"
    });

    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }
    if (result.error) {
      console.error("[prisma-generate-auto] spawn error:", result.error);
    }
    if (result.signal) {
      console.error(`[prisma-generate-auto] process terminated by signal: ${result.signal}`);
    }

    if (result.status === 0) {
      console.log("[prisma-generate-auto] RESULT=PASS");
      return;
    }

    lastStatus = result.status ?? 1;
    const combinedOutput =
      `${result.stdout ?? ""}\n${result.stderr ?? ""}` +
      (result.error ? `\n${result.error.message ?? String(result.error)}` : "");
    lastCombinedOutput = combinedOutput;
    const shouldRetry = attempt < MAX_GENERATE_ATTEMPTS && isRetriableFailure(combinedOutput);
    if (!shouldRetry) {
      break;
    }

    console.warn(
      `[prisma-generate-auto] transient failure detected (attempt ${attempt}/${MAX_GENERATE_ATTEMPTS}). Retrying...`
    );
    await sleep(RETRY_DELAY_MS * attempt);
  }

  if (!strictMode && isRetriableFailure(lastCombinedOutput) && existsSync(fallbackClientPath)) {
    console.warn(
      `[prisma-generate-auto] generation failed with a retriable filesystem error. ` +
        `Using existing client at ${fallbackClientPath}.`
    );
    console.warn("[prisma-generate-auto] RESULT=FALLBACK");
    return;
  }

  console.error("[prisma-generate-auto] RESULT=FAILED");
  process.exit(lastStatus);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
