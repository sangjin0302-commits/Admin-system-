import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ENGINE_FILE_PATTERN =
  /^(libquery_engine-.*\.(so|dylib)\.node|query_engine-.*\.dll\.node)$/i;

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveNextChunksDir(rootDir) {
  const distCandidates = [".next", ".next-local", ".next-prod"];
  const available = [];
  for (const distDir of distCandidates) {
    const chunksDir = path.join(rootDir, distDir, "server", "chunks");
    if (await exists(chunksDir)) {
      const metadata = await stat(chunksDir);
      available.push({
        chunksDir,
        serverDir: path.join(rootDir, distDir, "server"),
        mtimeMs: metadata.mtimeMs
      });
    }
  }
  if (available.length > 0) {
    available.sort((left, right) => right.mtimeMs - left.mtimeMs);
    return available[0];
  }
  throw new Error("Next.js server chunks directory not found after build.");
}

async function collectNftFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectNftFiles(absolutePath);
      }
      if (entry.isFile() && entry.name.endsWith(".nft.json")) {
        return [absolutePath];
      }
      return [];
    })
  );
  return files.flat();
}

async function injectEnginesIntoNftFiles(serverDir, chunksDir, engineFiles) {
  const nftFiles = await collectNftFiles(serverDir);
  let updatedCount = 0;

  for (const nftPath of nftFiles) {
    const raw = await readFile(nftPath, "utf8");
    const manifest = JSON.parse(raw);
    if (!Array.isArray(manifest.files)) {
      continue;
    }

    let changed = false;
    for (const engineFile of engineFiles) {
      const relativePath = path
        .relative(path.dirname(nftPath), path.join(chunksDir, engineFile))
        .split(path.sep)
        .join("/");
      if (!manifest.files.includes(relativePath)) {
        manifest.files.push(relativePath);
        changed = true;
      }
    }

    if (changed) {
      await writeFile(nftPath, JSON.stringify(manifest), "utf8");
      updatedCount += 1;
    }
  }

  return updatedCount;
}

async function main() {
  const rootDir = process.cwd();
  const prismaClientDir = path.join(rootDir, "generated", "prisma-client-next");
  const { chunksDir, serverDir } = await resolveNextChunksDir(rootDir);

  if (!(await exists(prismaClientDir))) {
    throw new Error(`Prisma client directory not found: ${prismaClientDir}`);
  }

  const clientFiles = await readdir(prismaClientDir);
  const engineFiles = clientFiles.filter((fileName) => ENGINE_FILE_PATTERN.test(fileName));
  if (engineFiles.length === 0) {
    throw new Error(`No Prisma query engine file found in ${prismaClientDir}`);
  }

  await mkdir(chunksDir, { recursive: true });
  for (const engineFile of engineFiles) {
    const sourcePath = path.join(prismaClientDir, engineFile);
    const destinationPath = path.join(chunksDir, engineFile);
    await cp(sourcePath, destinationPath, { force: true });
  }

  const injectedNftCount = await injectEnginesIntoNftFiles(serverDir, chunksDir, engineFiles);

  console.log(
    `[ensure-prisma-engine-runtime] copied ${engineFiles.length} engine file(s) to ${chunksDir}; updated ${injectedNftCount} nft manifest(s)`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
