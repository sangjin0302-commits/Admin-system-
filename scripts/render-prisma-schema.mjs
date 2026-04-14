import fs from "node:fs";
import path from "node:path";

const provider = process.argv[2]?.trim();

if (!provider || !["sqlite", "postgresql"].includes(provider)) {
  throw new Error("Usage: node scripts/render-prisma-schema.mjs <sqlite|postgresql>");
}

const sourcePath = path.join(process.cwd(), "prisma", "schema.prisma");
const targetPath = path.join(process.cwd(), ".codex-tmp", `schema.${provider}.prisma`);

const source = fs.readFileSync(sourcePath, "utf8");
const rendered = source.replace('provider = "sqlite"', `provider = "${provider}"`);

if (rendered === source && provider !== "sqlite") {
  throw new Error("Failed to render provider-specific Prisma schema.");
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, rendered, "utf8");

console.log(`Rendered Prisma schema for ${provider} to ${targetPath}`);
