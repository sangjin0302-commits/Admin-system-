/**
 * 행정사 협업 네트워크 — 동료 행정사 사건 공유/재배정.
 * 저장:
 *   - "admin_network.peers"    → NetworkPeer[]
 *   - "admin_network.shares"   → CaseShareEntry[]
 *   - "admin_network.handoffs" → CaseHandoffEntry[]
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const PEERS_KEY = "admin_network.peers";
const SHARES_KEY = "admin_network.shares";
const HANDOFFS_KEY = "admin_network.handoffs";

export type NetworkPeer = {
  id: string;
  name: string;
  firm: string;
  specialties: string[];
  contactEmail: string;
  phone?: string;
  verified: boolean;
  joinedAt: string;
  notes?: string;
};

export type CaseShareEntry = {
  id: string;
  caseId: string;
  peerId: string;
  message: string;
  createdAt: string;
  status: "sent" | "acknowledged" | "declined";
};

export type CaseHandoffEntry = {
  id: string;
  caseId: string;
  peerId: string;
  splitPct: number; // 0..100 원 소유자 몫 %
  createdAt: string;
  status: "proposed" | "accepted" | "completed" | "cancelled";
  note?: string;
};

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    const parsed = JSON.parse(row.value);
    return (parsed as T) ?? fallback;
  } catch (err) {
    logger.warn(`[admin-network] read ${key} failed`, err);
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const v = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: v },
    update: { value: v },
  });
}

export async function listPeers(): Promise<NetworkPeer[]> {
  return readJson<NetworkPeer[]>(PEERS_KEY, []);
}

export async function addPeer(input: {
  name: string;
  firm: string;
  specialties: string[];
  contactEmail: string;
  phone?: string;
  verified?: boolean;
  notes?: string;
}): Promise<NetworkPeer> {
  const peers = await listPeers();
  const peer: NetworkPeer = {
    id: newId("peer"),
    name: input.name.trim(),
    firm: input.firm.trim(),
    specialties: input.specialties.map((s) => s.trim()).filter(Boolean),
    contactEmail: input.contactEmail.trim().toLowerCase(),
    phone: input.phone?.trim(),
    verified: input.verified ?? false,
    joinedAt: new Date().toISOString(),
    notes: input.notes?.trim(),
  };
  peers.push(peer);
  await writeJson(PEERS_KEY, peers);
  return peer;
}

export async function verifyPeer(id: string): Promise<NetworkPeer | null> {
  const peers = await listPeers();
  const idx = peers.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  peers[idx] = { ...peers[idx], verified: true };
  await writeJson(PEERS_KEY, peers);
  return peers[idx];
}

export async function removePeer(id: string): Promise<boolean> {
  const peers = await listPeers();
  const filtered = peers.filter((p) => p.id !== id);
  if (filtered.length === peers.length) return false;
  await writeJson(PEERS_KEY, filtered);
  return true;
}

export async function listShares(): Promise<CaseShareEntry[]> {
  return readJson<CaseShareEntry[]>(SHARES_KEY, []);
}

export async function shareCaseWithPeer(
  caseId: string,
  peerId: string,
  message: string
): Promise<CaseShareEntry> {
  const shares = await listShares();
  const entry: CaseShareEntry = {
    id: newId("shr"),
    caseId,
    peerId,
    message: message.trim(),
    createdAt: new Date().toISOString(),
    status: "sent",
  };
  shares.push(entry);
  await writeJson(SHARES_KEY, shares);
  return entry;
}

export async function listHandoffs(): Promise<CaseHandoffEntry[]> {
  return readJson<CaseHandoffEntry[]>(HANDOFFS_KEY, []);
}

export async function handoffCase(
  caseId: string,
  peerId: string,
  splitPct: number,
  note?: string
): Promise<CaseHandoffEntry> {
  const clamped = Math.max(0, Math.min(100, Math.round(splitPct)));
  const handoffs = await listHandoffs();
  const entry: CaseHandoffEntry = {
    id: newId("hnd"),
    caseId,
    peerId,
    splitPct: clamped,
    createdAt: new Date().toISOString(),
    status: "proposed",
    note: note?.trim(),
  };
  handoffs.push(entry);
  await writeJson(HANDOFFS_KEY, handoffs);
  return entry;
}

export async function updateHandoffStatus(
  id: string,
  status: CaseHandoffEntry["status"]
): Promise<CaseHandoffEntry | null> {
  const handoffs = await listHandoffs();
  const idx = handoffs.findIndex((h) => h.id === id);
  if (idx < 0) return null;
  handoffs[idx] = { ...handoffs[idx], status };
  await writeJson(HANDOFFS_KEY, handoffs);
  return handoffs[idx];
}

export function calcCommissionSplit(
  fee: number,
  ownerPct: number
): { ownerAmount: number; peerAmount: number } {
  const owner = Math.max(0, Math.min(100, ownerPct));
  const ownerAmount = Math.round((fee * owner) / 100);
  return { ownerAmount, peerAmount: fee - ownerAmount };
}
