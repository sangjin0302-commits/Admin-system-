/**
 * AdminUser 시드 — 첫 SUPER 1명 생성 (idempotent).
 *
 * 사용:
 *   ADMIN_SEED_EMAIL=...@example.com \
 *   ADMIN_SEED_NAME="홍길동" \
 *   ADMIN_SEED_PASSWORD=초기비번 \
 *   tsx scripts/seed-admin-user.ts
 *
 * 이미 같은 이메일이 있으면 비번/이름/역할만 업데이트.
 */

import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma/client";

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL?.trim();
  const name = process.env.ADMIN_SEED_NAME?.trim() || "ETHOS Admin";
  const password = process.env.ADMIN_SEED_PASSWORD;
  const role = (process.env.ADMIN_SEED_ROLE?.trim() || "SUPER") as
    | "SUPER"
    | "MANAGER"
    | "STAFF"
    | "EXTERNAL"
    | "AUDITOR";

  if (!email) {
    console.error("ADMIN_SEED_EMAIL is required");
    process.exit(1);
  }
  if (!password || password.length < 8) {
    console.error("ADMIN_SEED_PASSWORD must be ≥8 chars");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    await prisma.adminUser.update({
      where: { email },
      data: { name, role, passwordHash, active: true },
    });
    console.log(`[seed-admin] updated: ${email} role=${role}`);
  } else {
    await prisma.adminUser.create({
      data: { email, name, role, passwordHash, active: true },
    });
    console.log(`[seed-admin] created: ${email} role=${role}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-admin] failed", err);
  process.exit(1);
});
