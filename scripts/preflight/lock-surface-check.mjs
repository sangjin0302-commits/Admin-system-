import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();

const lockTargets = [
  {
    name: ".git index lock",
    path: path.join(rootDir, ".git", "index.lock"),
    severity: "error"
  },
  {
    name: "Next build lock",
    path: path.join(rootDir, ".next", "lock"),
    severity: "warn"
  }
];

function findPrismaTmpEngines() {
  const dir = path.join(rootDir, "generated", "prisma-client-next");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((entry) => entry.startsWith("query_engine-windows.dll.node.tmp"))
    .map((entry) => path.join(dir, entry));
}

function main() {
  console.log("[preflight:locks] checking lock and temp artifact surface...");

  let hasError = false;

  for (const target of lockTargets) {
    if (!existsSync(target.path)) {
      console.log(`[preflight:locks] OK ${target.name} not found`);
      continue;
    }

    if (target.severity === "error") {
      hasError = true;
      console.error(`[preflight:locks] ERROR ${target.name} found: ${target.path}`);
    } else {
      console.warn(`[preflight:locks] WARN ${target.name} found: ${target.path}`);
    }
  }

  const prismaTmp = findPrismaTmpEngines();
  if (prismaTmp.length > 0) {
    console.warn(
      `[preflight:locks] WARN prisma temp engine remnants detected (${prismaTmp.length}).`
    );
    for (const item of prismaTmp.slice(0, 5)) {
      console.warn(`[preflight:locks] WARN temp file: ${item}`);
    }
  } else {
    console.log("[preflight:locks] OK no prisma temp engine remnants");
  }

  if (hasError) {
    process.exitCode = 1;
    return;
  }

  console.log("[preflight:locks] completed.");
}

main();
