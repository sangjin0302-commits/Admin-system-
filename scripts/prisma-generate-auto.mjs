import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

import { getRenderedSchemaPath, normalizeProvider, renderPrismaSchema } from "./render-prisma-schema.mjs";

async function main() {
  const provider = normalizeProvider(process.env.PRISMA_DB_PROVIDER);
  const rootDir = process.cwd();
  const prismaCliPath = path.join(rootDir, "node_modules", "prisma", "build", "index.js");

  await renderPrismaSchema(provider);

  const schemaPath = getRenderedSchemaPath(rootDir, provider);
  const result = spawnSync(process.execPath, [prismaCliPath, "generate", "--schema", schemaPath], {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
