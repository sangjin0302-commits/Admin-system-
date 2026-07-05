/**
 * 다중 관리자 실시간 동기 (SSE).
 *
 * 기능:
 *  - 접속 중인 관리자 존재 표시
 *  - 편집 락(soft): 다른 관리자가 편집 중이면 경고
 *  - 액션 브로드캐스트: "김민수 행정사가 사건 #123 편집 중"
 *
 * 저장: 인메모리 (서버 인스턴스 단위) — Vercel 서버리스는 인스턴스가 나뉘므로
 *       크로스-인스턴스 동기가 필요하면 DB 폴백을 사용.
 * DB 폴백: SiteSetting `admin.presence` — 30초 하트비트 후 만료.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const PRESENCE_KEY = "admin.presence";
const PRESENCE_TTL_MS = 60_000;
const HEARTBEAT_MS = 30_000;

export type AdminPresence = {
  adminId: string;
  adminName?: string;
  lastSeenAt: string;
  currentPath?: string;
  editingEntityType?: string;
  editingEntityId?: string;
};

export type AdminSyncEvent =
  | { type: "presence"; presence: AdminPresence[]; timestamp: string }
  | { type: "action"; action: string; adminId: string; adminName?: string; entityType?: string; entityId?: string; timestamp: string }
  | { type: "ping"; timestamp: string }
  | { type: "connected"; timestamp: string };

const encoder = new TextEncoder();
const subscribers = new Map<string, Set<ReadableStreamDefaultController>>();

export function subscribeAdminPresence(
  adminId: string,
  controller: ReadableStreamDefaultController
): () => void {
  let set = subscribers.get(adminId);
  if (!set) {
    set = new Set();
    subscribers.set(adminId, set);
  }
  set.add(controller);
  return () => {
    const s = subscribers.get(adminId);
    if (!s) return;
    s.delete(controller);
    if (s.size === 0) subscribers.delete(adminId);
  };
}

export function adminPresenceSubscriberCount(adminId: string): number {
  return subscribers.get(adminId)?.size ?? 0;
}

function broadcastToAll(event: AdminSyncEvent): void {
  const chunk = encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  for (const [, set] of subscribers) {
    for (const controller of set) {
      try {
        controller.enqueue(chunk);
      } catch {
        set.delete(controller);
      }
    }
  }
}

async function readPresenceStore(): Promise<AdminPresence[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: PRESENCE_KEY } });
    if (!row?.value) return [];
    const arr = JSON.parse(row.value);
    if (!Array.isArray(arr)) return [];
    const now = Date.now();
    return (arr as AdminPresence[]).filter((p) => {
      const t = Date.parse(p.lastSeenAt);
      return Number.isFinite(t) && now - t < PRESENCE_TTL_MS;
    });
  } catch {
    return [];
  }
}

async function writePresenceStore(list: AdminPresence[]): Promise<void> {
  try {
    await prisma.siteSetting.upsert({
      where: { key: PRESENCE_KEY },
      create: { key: PRESENCE_KEY, value: JSON.stringify(list) },
      update: { value: JSON.stringify(list) },
    });
  } catch (err) {
    logger.warn("[multi-admin-sync] presence 저장 실패", err);
  }
}

export async function heartbeat(input: {
  adminId: string;
  adminName?: string;
  currentPath?: string;
  editingEntityType?: string;
  editingEntityId?: string;
}): Promise<AdminPresence[]> {
  const list = await readPresenceStore();
  const idx = list.findIndex((p) => p.adminId === input.adminId);
  const entry: AdminPresence = {
    adminId: input.adminId,
    adminName: input.adminName,
    currentPath: input.currentPath,
    editingEntityType: input.editingEntityType,
    editingEntityId: input.editingEntityId,
    lastSeenAt: new Date().toISOString(),
  };
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  await writePresenceStore(list);
  broadcastToAll({ type: "presence", presence: list, timestamp: entry.lastSeenAt });
  return list;
}

export async function getActivePresence(): Promise<AdminPresence[]> {
  return readPresenceStore();
}

export async function getCurrentEditor(
  entityType: string,
  entityId: string,
  excludeAdminId?: string
): Promise<AdminPresence | null> {
  const list = await readPresenceStore();
  return (
    list.find(
      (p) =>
        p.editingEntityType === entityType &&
        p.editingEntityId === entityId &&
        p.adminId !== excludeAdminId
    ) ?? null
  );
}

export function broadcastAction(input: {
  action: string;
  adminId: string;
  adminName?: string;
  entityType?: string;
  entityId?: string;
}): void {
  broadcastToAll({
    type: "action",
    action: input.action,
    adminId: input.adminId,
    adminName: input.adminName,
    entityType: input.entityType,
    entityId: input.entityId,
    timestamp: new Date().toISOString(),
  });
}

export const ADMIN_PRESENCE_HEARTBEAT_MS = HEARTBEAT_MS;
