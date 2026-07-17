/**
 * getAllFlags 캐시 경쟁 검증.
 *
 * 1) in-flight 공유 — 동시 호출 N개가 DB를 1회만 읽는가
 * 2) write-after-invalidate — 읽는 도중 무효화가 나면 낡은 값을 캐시에 쓰지 않는가
 *
 * 실행: npx tsx scripts/tests/feature-flags-cache-race-check.ts
 */
import assert from "node:assert/strict";

import { prisma } from "@/lib/prisma/client";
import {
  getAllFlags,
  invalidateFeatureFlagsCache,
  setFeatureEnabled,
} from "@/lib/services/feature-flags-service";

const KEY = "dark_mode_manual_toggle";

let reads = 0;
let stored: string | null = null;
let resolveGate: (() => void) | null = null;

// prisma.siteSetting.findUnique 스텁 — 실제 DB 없이 읽기 횟수/지연을 통제합니다.
(prisma as any).siteSetting = {
  findUnique: async () => {
    reads += 1;
    if (resolveGate) {
      await new Promise<void>((resolve) => {
        resolveGate = resolve;
      });
    }
    return stored === null ? null : { key: "feature.flags", value: stored };
  },
};

async function main() {
  // ── 1. in-flight 공유 ──────────────────────────────
  invalidateFeatureFlagsCache();
  reads = 0;
  stored = JSON.stringify({ [KEY]: false });

  const results = await Promise.all([getAllFlags(), getAllFlags(), getAllFlags(), getAllFlags()]);
  assert.equal(reads, 1, `동시 호출 4개는 DB를 1회만 읽어야 함 (실제 ${reads}회)`);
  for (const r of results) assert.equal(r[KEY], false);
  console.log("✓ in-flight 공유: 동시 호출 4개 → DB 읽기 1회");

  // ── 2. write-after-invalidate ─────────────────────
  invalidateFeatureFlagsCache();
  reads = 0;

  // 읽기를 멈춰 세운다.
  let release!: () => void;
  resolveGate = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  (prisma as any).siteSetting.findUnique = async () => {
    reads += 1;
    // 읽기 "시작" 시점의 값을 잡아둔다. gate 뒤에 읽으면 새 값이 나와
    // 낡은 읽기를 재현하지 못한다 (이게 이 테스트의 핵심).
    const snapshot = stored;
    await gate;
    return { key: "feature.flags", value: snapshot };
  };

  stored = JSON.stringify({ [KEY]: false }); // 읽기 시작 시점의 낡은 값
  const inflight = getAllFlags();

  // 읽는 도중 값이 바뀌고 무효화된다.
  stored = JSON.stringify({ [KEY]: true });
  invalidateFeatureFlagsCache();

  release();
  await inflight;

  // 낡은 읽기가 캐시를 오염시켰다면 여기서 false가 나온다.
  const after = await getAllFlags();
  assert.equal(
    after[KEY],
    true,
    "무효화 전에 시작된 읽기가 낡은 값을 캐시에 써서는 안 됨 (30초간 옛 값 고착)"
  );
  console.log("✓ write-after-invalidate: 낡은 읽기가 캐시를 오염시키지 않음");

  console.log("\n통과.");
}

main().catch((err) => {
  console.error("실패:", err.message);
  process.exit(1);
});

void setFeatureEnabled;
