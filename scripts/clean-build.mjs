import { rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const targets = [".next", ".next-prod", "tsconfig.tsbuildinfo"].map((target) =>
  resolve(process.cwd(), target)
);

for (const target of targets) {
  if (!existsSync(target)) {
    continue;
  }

  rmSync(target, { recursive: true, force: true });
  console.log(`removed: ${target}`);
}

console.log("build cache cleanup complete");
