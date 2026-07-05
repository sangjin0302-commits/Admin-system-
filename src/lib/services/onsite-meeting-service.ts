/**
 * 온사이트 미팅 관리 — 방문 상담 스케줄 + 동선 최적화.
 * 저장: SiteSetting "onsite.meetings" → OnsiteMeeting[]
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const STORE_KEY = "onsite.meetings";

export type OnsiteMeetingStatus = "scheduled" | "en_route" | "completed" | "cancelled";

export type OnsiteMeeting = {
  id: string;
  caseId?: string;
  clientName: string;
  address: string;
  latitude: number;
  longitude: number;
  scheduledAt: string; // ISO
  durationMin: number;
  notes?: string;
  status: OnsiteMeetingStatus;
  createdAt: string;
};

export type LatLng = { latitude: number; longitude: number };

function newId(): string {
  return `ons_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readAll(): Promise<OnsiteMeeting[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: STORE_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as OnsiteMeeting[]) : [];
  } catch (err) {
    logger.warn("[onsite] read failed", err);
    return [];
  }
}

async function writeAll(list: OnsiteMeeting[]): Promise<void> {
  const v = JSON.stringify(list);
  await prisma.siteSetting.upsert({
    where: { key: STORE_KEY },
    create: { key: STORE_KEY, value: v },
    update: { value: v },
  });
}

export async function listMeetings(): Promise<OnsiteMeeting[]> {
  return readAll();
}

export async function listMeetingsByDate(dateYMD: string): Promise<OnsiteMeeting[]> {
  const all = await readAll();
  return all
    .filter((m) => m.scheduledAt.slice(0, 10) === dateYMD)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export async function addMeeting(input: {
  caseId?: string;
  clientName: string;
  address: string;
  latitude: number;
  longitude: number;
  scheduledAt: string;
  durationMin: number;
  notes?: string;
}): Promise<OnsiteMeeting> {
  const all = await readAll();
  const meeting: OnsiteMeeting = {
    id: newId(),
    caseId: input.caseId,
    clientName: input.clientName.trim(),
    address: input.address.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    scheduledAt: input.scheduledAt,
    durationMin: Math.max(15, input.durationMin),
    notes: input.notes?.trim(),
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };
  all.push(meeting);
  await writeAll(all);
  return meeting;
}

export async function updateMeetingStatus(
  id: string,
  status: OnsiteMeetingStatus
): Promise<OnsiteMeeting | null> {
  const all = await readAll();
  const idx = all.findIndex((m) => m.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], status };
  await writeAll(all);
  return all[idx];
}

export async function deleteMeeting(id: string): Promise<boolean> {
  const all = await readAll();
  const filtered = all.filter((m) => m.id !== id);
  if (filtered.length === all.length) return false;
  await writeAll(filtered);
  return true;
}

/** Haversine 거리 (km). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * 최근접 이웃 탐색으로 방문 순서 최적화.
 * 반환: { order: OnsiteMeeting[], totalKm, estMinutes }
 * 이동 속도 가정: 도심 25 km/h.
 */
export function optimizeDailyRoute(
  meetings: OnsiteMeeting[],
  startLocation: LatLng
): { order: OnsiteMeeting[]; totalKm: number; estTravelMinutes: number } {
  if (meetings.length === 0) {
    return { order: [], totalKm: 0, estTravelMinutes: 0 };
  }
  const remaining = [...meetings];
  const order: OnsiteMeeting[] = [];
  let current: LatLng = startLocation;
  let totalKm = 0;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = haversineKm(current, remaining[0]);
    for (let i = 1; i < remaining.length; i++) {
      const d = haversineKm(current, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    totalKm += bestDist;
    current = { latitude: next.latitude, longitude: next.longitude };
    order.push(next);
  }
  const estTravelMinutes = Math.round((totalKm / 25) * 60);
  return { order, totalKm: Math.round(totalKm * 10) / 10, estTravelMinutes };
}

/** 카카오맵 임베드 URL — API 키 불필요, view-only. */
export function kakaoMapEmbedUrl(points: LatLng[]): string {
  if (points.length === 0) return "https://map.kakao.com/";
  const center = points[0];
  return `https://map.kakao.com/link/map/onsite,${center.latitude},${center.longitude}`;
}
