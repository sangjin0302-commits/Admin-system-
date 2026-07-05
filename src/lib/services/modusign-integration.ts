/**
 * 모두싸인 (Modusign) 전자계약 연동 서비스 (스텁 + 로컬 큐).
 *
 * 기존 `e-signature-service.ts`는 ESignRequest 모델을 사용해 실제 발신·상태 추적을 담당합니다.
 * 이 파일은 모두싸인 전용 UI(관리자 페이지) + 템플릿 목록·전송·상태 조회 헬퍼를 제공합니다.
 * 미이지티(cert) 없이 dry-run으로 동작하고, 실제 API 키가 있으면 fetch로 호출합니다.
 *
 * 필요 환경 변수:
 *   MODUSIGN_API_KEY    — 모두싸인 API 키 (Bearer)
 *   MODUSIGN_SECRET     — Webhook 검증 시크릿 (기존 e-signature-service가 사용)
 *   MODUSIGN_API_BASE   — 기본값 https://api.modusign.co.kr
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const OUTBOX_KEY = "integration.modusign.outbox";

export type Signer = { email: string; name: string; role?: string };

export type ModusignTemplate = {
  id: string;
  name: string;
  updatedAt?: string;
  status?: string;
};

export type SignatureRequestStatus = "PENDING" | "SIGNED" | "CANCELLED" | "EXPIRED" | "REJECTED";

export type SignatureRequest = {
  id: string;
  caseId?: string;
  templateId: string;
  templateName?: string;
  docUrl?: string;
  signers: Signer[];
  status: SignatureRequestStatus;
  createdAt: string;
  updatedAt?: string;
  externalRef?: string;
  dryRun: boolean;
};

const API_BASE = process.env.MODUSIGN_API_BASE?.trim() || "https://api.modusign.co.kr";

function hasCreds(): boolean {
  return Boolean(process.env.MODUSIGN_API_KEY?.trim());
}

async function readOutbox(): Promise<SignatureRequest[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: OUTBOX_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as SignatureRequest[]) : [];
  } catch (err) {
    logger.warn("[modusign] outbox read failed", err);
    return [];
  }
}

async function writeOutbox(items: SignatureRequest[]): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: OUTBOX_KEY },
    create: { key: OUTBOX_KEY, value: JSON.stringify(items.slice(-200)) },
    update: { value: JSON.stringify(items.slice(-200)) },
  });
}

export async function listTemplates(): Promise<ModusignTemplate[]> {
  if (!hasCreds()) {
    // 스텁 템플릿 — UI 확인용 예시
    return [
      { id: "tpl_delegation", name: "위임장 표준", status: "active" },
      { id: "tpl_retainer", name: "수임 계약서 (기본)", status: "active" },
      { id: "tpl_nda", name: "비밀유지 서약서", status: "active" },
    ];
  }
  try {
    const res = await fetch(`${API_BASE}/templates`, {
      headers: {
        Authorization: `Bearer ${process.env.MODUSIGN_API_KEY}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`모두싸인 템플릿 조회 실패 ${res.status}`);
    const json = (await res.json()) as { templates?: unknown[] };
    const arr = Array.isArray(json.templates) ? json.templates : [];
    return arr.map((v) => {
      const t = v as Record<string, unknown>;
      return {
        id: String(t.id ?? t.templateId ?? ""),
        name: String(t.name ?? t.title ?? "제목없음"),
        updatedAt: t.updatedAt ? String(t.updatedAt) : undefined,
        status: t.status ? String(t.status) : undefined,
      };
    });
  } catch (err) {
    logger.warn("[modusign] template list failed", err);
    return [];
  }
}

export async function createSignatureRequest(
  caseId: string | undefined,
  templateId: string,
  signers: Signer[],
  templateName?: string,
): Promise<SignatureRequest> {
  if (!signers.length) throw new Error("서명자 목록이 비어 있습니다");

  const dryRun = !hasCreds();
  let externalRef: string | undefined;
  let docUrl: string | undefined;

  if (!dryRun) {
    try {
      const res = await fetch(`${API_BASE}/documents/request-with-template`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MODUSIGN_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ templateId, participants: signers }),
      });
      if (res.ok) {
        const json = (await res.json()) as { id?: string; documentId?: string; embeddedUrl?: string };
        externalRef = json.id ?? json.documentId;
        docUrl = json.embeddedUrl;
      } else {
        logger.warn(`[modusign] create request failed ${res.status}`);
      }
    } catch (err) {
      logger.warn("[modusign] create request error", err);
    }
  }

  const req: SignatureRequest = {
    id: `sig_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    caseId,
    templateId,
    templateName,
    docUrl,
    signers,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    externalRef,
    dryRun,
  };
  const box = await readOutbox();
  box.push(req);
  await writeOutbox(box);
  return req;
}

export async function getStatus(requestId: string): Promise<SignatureRequest | null> {
  const box = await readOutbox();
  const req = box.find((v) => v.id === requestId);
  if (!req) return null;

  if (!req.externalRef || req.dryRun) return req;
  try {
    const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(req.externalRef)}`, {
      headers: { Authorization: `Bearer ${process.env.MODUSIGN_API_KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return req;
    const json = (await res.json()) as { status?: string };
    const mapped = mapModusignStatus(json.status);
    if (mapped && mapped !== req.status) {
      const updated: SignatureRequest = { ...req, status: mapped, updatedAt: new Date().toISOString() };
      const idx = box.findIndex((v) => v.id === requestId);
      box[idx] = updated;
      await writeOutbox(box);
      return updated;
    }
    return req;
  } catch (err) {
    logger.warn("[modusign] status poll failed", err);
    return req;
  }
}

function mapModusignStatus(s?: string): SignatureRequestStatus | null {
  if (!s) return null;
  const v = s.toLowerCase();
  if (v.includes("sign") || v.includes("complete")) return "SIGNED";
  if (v.includes("reject")) return "REJECTED";
  if (v.includes("expire")) return "EXPIRED";
  if (v.includes("cancel")) return "CANCELLED";
  return "PENDING";
}

export async function listOutbox(limit = 100): Promise<SignatureRequest[]> {
  const box = await readOutbox();
  return box.slice(-limit).reverse();
}

export async function listPendingForCase(caseId: string): Promise<SignatureRequest[]> {
  const box = await readOutbox();
  return box.filter((v) => v.caseId === caseId && (v.status === "PENDING")).slice(-10).reverse();
}

export function getCredentialStatus(): { apiKey: boolean; secret: boolean } {
  return {
    apiKey: Boolean(process.env.MODUSIGN_API_KEY?.trim()),
    secret: Boolean(process.env.MODUSIGN_SECRET?.trim()),
  };
}
