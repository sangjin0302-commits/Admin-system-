/**
 * 채용/멘토링 지원서 관리 서비스.
 *
 * 저장: SiteSetting key = "careers.applications", value = JSON.stringify(Application[])
 * 마이그레이션 없이 SiteSetting JSON에 리스트를 누적.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const SITE_SETTING_KEY = "careers.applications";

export type CareerTrack = "fulltime" | "parttime" | "mentoring";

export const CAREER_TRACK_LABEL: Record<CareerTrack, string> = {
  fulltime: "정규직",
  parttime: "파트타임",
  mentoring: "멘토링",
};

export type CareerStatus = "new" | "review" | "interview" | "hired" | "rejected";

export const CAREER_STATUS_LABEL: Record<CareerStatus, string> = {
  new: "신규",
  review: "검토",
  interview: "면접",
  hired: "합격",
  rejected: "불합격",
};

export type CareerApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  track: CareerTrack;
  resumeUrl?: string;
  cover: string;
  status: CareerStatus;
  note?: string;
  submittedAt: string; // ISO
};

function makeId() {
  return `car_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readAll(): Promise<CareerApplication[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SITE_SETTING_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidApplication);
  } catch (err) {
    logger.warn("[careers] read failed", err);
    return [];
  }
}

function isValidApplication(x: unknown): x is CareerApplication {
  if (!x || typeof x !== "object") return false;
  const a = x as Record<string, unknown>;
  return (
    typeof a.id === "string" &&
    typeof a.name === "string" &&
    typeof a.email === "string" &&
    typeof a.phone === "string" &&
    typeof a.track === "string" &&
    typeof a.cover === "string" &&
    typeof a.status === "string" &&
    typeof a.submittedAt === "string"
  );
}

async function writeAll(items: CareerApplication[]): Promise<void> {
  const value = JSON.stringify(items);
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEY },
    create: { key: SITE_SETTING_KEY, value },
    update: { value },
  });
}

export async function listApplications(): Promise<CareerApplication[]> {
  const items = await readAll();
  return items.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

export async function getApplication(id: string): Promise<CareerApplication | null> {
  const items = await readAll();
  return items.find((a) => a.id === id) ?? null;
}

export type CreateApplicationInput = {
  name: string;
  email: string;
  phone: string;
  track: CareerTrack;
  resumeUrl?: string;
  cover: string;
};

export async function createApplication(input: CreateApplicationInput): Promise<CareerApplication> {
  const app: CareerApplication = {
    id: makeId(),
    name: input.name.trim().slice(0, 60),
    email: input.email.trim().slice(0, 120),
    phone: input.phone.trim().slice(0, 30),
    track: input.track,
    resumeUrl: input.resumeUrl?.trim().slice(0, 500),
    cover: input.cover.trim().slice(0, 4000),
    status: "new",
    submittedAt: new Date().toISOString(),
  };
  const items = await readAll();
  items.push(app);
  // Keep at most 500 entries (older trimmed) to avoid unbounded growth in JSON blob.
  const trimmed = items.slice(-500);
  await writeAll(trimmed);
  return app;
}

export async function updateApplicationStatus(
  id: string,
  status: CareerStatus,
  note?: string,
): Promise<CareerApplication | null> {
  const items = await readAll();
  const idx = items.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  items[idx] = {
    ...items[idx],
    status,
    note: note !== undefined ? note.slice(0, 2000) : items[idx].note,
  };
  await writeAll(items);
  return items[idx];
}

export function isValidTrack(v: unknown): v is CareerTrack {
  return v === "fulltime" || v === "parttime" || v === "mentoring";
}

export function isValidStatus(v: unknown): v is CareerStatus {
  return v === "new" || v === "review" || v === "interview" || v === "hired" || v === "rejected";
}
