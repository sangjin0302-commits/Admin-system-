import process from "node:process";

async function main() {
  process.env.PRISMA_GENERATE_STRICT = "1";
  await import("../prisma-generate-auto.mjs");
  await import("../prepare-prisma-client.mjs");
}

main().catch((error) => {
  console.error("[build:prepare:strict] failed:", error);
  process.exitCode = 1;
});
