/**
 * 정부24 서류 자동 발급 서비스 (스텁)
 *
 * 실제 정부24 API는 OAuth + 본인 동의(간편인증/공동인증서)가 필요합니다.
 * 이 서비스는 요청을 SiteSetting 큐에 저장하고, "수동 요청 필요" 응답을 돌려줍니다.
 *
 * 필요 환경 변수:
 *   GOV24_API_KEY           — 정부24 오픈 API 키
 *   GOV24_OAUTH_CLIENT_ID   — OAuth 클라이언트 ID
 *   GOV24_OAUTH_CLIENT_SECRET
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import {
  GOV24_DOC_TYPES,
  type Gov24DocCode,
  type Gov24Request,
  type Gov24RequestStatus,
} from "./gov24-types";

export { GOV24_DOC_TYPES, getStandardRequestTemplate } from "./gov24-types";
export type { Gov24DocCode, Gov24Request, Gov24RequestStatus } from "./gov24-types";

const QUEUE_KEY = "integration.gov24.queue";

async function readQueue(): Promise<Gov24Request[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: QUEUE_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as Gov24Request[]) : [];
  } catch (err) {
    logger.warn("[gov24] queue read failed", err);
    return [];
  }
}

async function writeQueue(items: Gov24Request[]): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: QUEUE_KEY },
    create: { key: QUEUE_KEY, value: JSON.stringify(items) },
    update: { value: JSON.stringify(items) },
  });
}

export async function listRequests(limit = 100): Promise<Gov24Request[]> {
  const q = await readQueue();
  return q.slice(-limit).reverse();
}

export async function requestDocument(
  type: Gov24DocCode,
  ownerConsent: boolean,
  meta: { caseId?: string; requesterName?: string; requesterEmail?: string; note?: string } = {},
): Promise<{ requestId: string; estimatedTime: string; status: Gov24RequestStatus; manualRequired: boolean; instructions: string }> {
  const def = GOV24_DOC_TYPES.find((d) => d.code === type);
  if (!def) throw new Error(`알 수 없는 서류 유형: ${type}`);
  if (!ownerConsent) throw new Error("본인 동의가 필요합니다");

  const q = await readQueue();
  const req: Gov24Request = {
    id: `gov_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    caseId: meta.caseId,
    requesterName: meta.requesterName,
    requesterEmail: meta.requesterEmail,
    docCode: type,
    docLabel: def.label,
    ownerConsent,
    status: "REQUESTED",
    requestedAt: new Date().toISOString(),
    estimatedTime: "영업일 기준 1-2일",
    note: meta.note,
  };
  q.push(req);
  await writeQueue(q);

  const hasApi = Boolean(process.env.GOV24_API_KEY?.trim());
  const instructions = hasApi
    ? "정부24 API 자동 발급 요청이 큐에 등록되었습니다. 상태를 확인해 주세요."
    : "정부24 API가 아직 설정되지 않았습니다. 정부24 웹사이트 또는 민원24 앱에서 수동으로 발급해 주세요.";

  // TODO: hasApi 이면 실제 정부24 오픈 API 호출 (OAuth 토큰 교환 → 서류 요청)
  return {
    requestId: req.id,
    estimatedTime: req.estimatedTime ?? "영업일 기준 1-2일",
    status: req.status,
    manualRequired: !hasApi,
    instructions,
  };
}

export async function updateRequestStatus(id: string, status: Gov24RequestStatus, externalRef?: string): Promise<Gov24Request | null> {
  const q = await readQueue();
  const idx = q.findIndex((v) => v.id === id);
  if (idx < 0) return null;
  q[idx] = { ...q[idx], status, externalRef: externalRef ?? q[idx].externalRef };
  await writeQueue(q);
  return q[idx];
}

