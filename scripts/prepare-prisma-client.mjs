import { spawnSync } from "node:child_process";

const provider = (process.env.DATABASE_PROVIDER || "sqlite").trim();

const command =
  provider === "postgresql"
    ? ["npm", "run", "prisma:generate:postgres"]
    : ["npx", "prisma", "generate", "--schema", "prisma/schema.prisma"];

const [file, ...args] = command;

const result = spawnSync(file, args, {
  stdio: "inherit",
  shell: process.platform === "win32"
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
