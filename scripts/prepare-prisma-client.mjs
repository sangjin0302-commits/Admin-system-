import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const generatedDir = path.join(rootDir, "generated");
const generatedClientDir = path.join(rootDir, "..", "admin-office-mvp-generated", "prisma-client");
const legacyClientDir = path.join(generatedDir, "prisma-v4");
const targetClientDir = path.join(generatedDir, "prisma-client");

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const sourceClientDir = (await exists(generatedClientDir)) ? generatedClientDir : legacyClientDir;

  if (!(await exists(sourceClientDir))) {
    throw new Error(`Prisma client source not found: ${sourceClientDir}`);
  }

  await mkdir(generatedDir, { recursive: true });

  if (await exists(targetClientDir)) {
    await rm(targetClientDir, { recursive: true, force: true });
  }

  await cp(sourceClientDir, targetClientDir, { recursive: true, force: true });
  console.log(`Prepared Prisma client in ${targetClientDir} from ${sourceClientDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
