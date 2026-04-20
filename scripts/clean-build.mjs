import { rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const targets = [".next", ".next-local", ".next-prod", "tsconfig.tsbuildinfo"].map((target) =>
  resolve(process.cwd(), target)
);

for (const target of targets) {
  if (!existsSync(target)) {
    continue;
  }

  try {
    rmSync(target, { recursive: true, force: true });
    console.log(`removed: ${target}`);
  } catch (error) {
    console.warn(`skip remove (locked): ${target}`);
    console.warn(error instanceof Error ? error.message : String(error));
  }
}

console.log("build cache cleanup complete");
