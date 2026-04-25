import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const generatedDir = path.join(rootDir, "generated");
const generatedClientNextDir = path.join(generatedDir, "prisma-client-next");
const legacyClientDir = path.join(generatedDir, "prisma-v4");
const targetClientDir = generatedClientNextDir;

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const sourceCandidates = [
    generatedClientNextDir,
    process.env.PRISMA_CLIENT_SOURCE?.trim(),
    legacyClientDir,
    targetClientDir
  ].filter(Boolean);

  const sourceClientDir =
    (await (async () => {
      for (const candidate of sourceCandidates) {
        if (await exists(candidate)) {
          return candidate;
        }
      }
      return null;
    })()) ?? null;

  if (!sourceClientDir) {
    throw new Error(`Prisma client source not found. Checked: ${sourceCandidates.join(", ")}`);
  }

  await mkdir(generatedDir, { recursive: true });

  if (path.resolve(sourceClientDir) === path.resolve(targetClientDir)) {
    console.log(`Prisma client already prepared at ${targetClientDir}`);
    return;
  }

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
