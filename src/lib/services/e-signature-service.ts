/**
 * Electronic signature service — Modusign 통합 + DB 영속화.
 *
 * 환경변수 MODUSIGN_API_KEY + MODUSIGN_USER_EMAIL + templateId 가 있으면 외부 발송,
 * 그 외는 in-memory MVP 클릭검증 폴백.  ESignRequest 모델로 모든 요청 영속화.
 */

import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";
import { prisma } from "@/lib/prisma/client";

export interface SignatureRequest {
  documentTitle: string;
  signerName: string;
  signerEmail: string;
  signerPhone?: string;
  documentUrl?: string;
  templateId?: string;
  caseId?: string;
  /** base64 PDF — Modusign 직접 업로드 흐름 (templateId 미사용 시). */
  pdfBase64?: string;
}

const MODUSIGN_BASE = "https://api.modusign.co.kr";

function getModusignConfig() {
  const apiKey = process.env.MODUSIGN_API_KEY?.trim();
  const userEmail = process.env.MODUSIGN_USER_EMAIL?.trim();
  if (!apiKey || !userEmail) return null;
  return { apiKey, userEmail };
}

export function isESignConnected(): boolean {
  return getModusignConfig() !== null;
}

function authHeader(cfg: { apiKey: string; userEmail: string }): string {
  return `Basic ${Buffer.from(`${cfg.userEmail}:${cfg.apiKey}`).toString("base64")}`;
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000"
  );
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createSignatureRequest(
  req: SignatureRequest
): Promise<{ requestId: string; signUrl: string; externalId?: string }> {
  const internalToken = randomUUID();
  const cfg = getModusignConfig();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // 0) Modusign + PDF base64 직접 업로드 (templateId 없을 때)
  if (cfg && req.pdfBase64 && !req.templateId) {
    try {
      const res = await fetch(`${MODUSIGN_BASE}/documents/upload-and-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(cfg),
        },
        body: JSON.stringify({
          document: {
            title: req.documentTitle,
            file: {
              name: `${req.documentTitle}.pdf`,
              base64: req.pdfBase64,
              extension: "pdf",
            },
          },
          participants: [
            {
              role: "서명자",
              name: req.signerName,
              signingMethod: { type: "EMAIL", value: req.signerEmail },
              signingDuration: 7 * 24 * 60, // minutes
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const externalId = data.id ?? data.documentId;
        const participantUrl =
          data.participants?.[0]?.signingMethod?.signingUrl ??
          data.signingUrl ??
          `https://app.modusign.co.kr/documents/${externalId}`;
        const row = await prisma.eSignRequest.create({
          data: {
            externalId,
            caseId: req.caseId,
            documentTitle: req.documentTitle,
            signerName: req.signerName,
            signerEmail: req.signerEmail,
            signerPhone: req.signerPhone,
            documentUrl: req.documentUrl,
            provider: "MODUSIGN",
            status: "PENDING",
            signUrl: participantUrl,
            internalToken,
            expiresAt,
            rawProviderJson: JSON.stringify(data).slice(0, 4000),
          },
        });
        return { requestId: row.id, signUrl: participantUrl, externalId };
      }
      const body = await res.text();
      logger.error("[e-signature] Modusign upload-and-request error", res.status, body);
      captureError(new Error(`Modusign upload ${res.status}`), { body });
    } catch (err) {
      captureError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // 1) Modusign 시도 (templateId 있고 cfg 있을 때만)
  if (cfg && req.templateId) {
    try {
      const res = await fetch(`${MODUSIGN_BASE}/documents/request-with-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(cfg),
        },
        body: JSON.stringify({
          templateId: req.templateId,
          document: { title: req.documentTitle },
          participantMappings: [
            {
              role: "서명자",
              name: req.signerName,
              signingMethod: { type: "EMAIL", value: req.signerEmail },
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const externalId = data.id ?? data.documentId;
        const participantUrl =
          data.participants?.[0]?.signingMethod?.signingUrl ??
          data.signingUrl ??
          `https://app.modusign.co.kr/documents/${externalId}`;

        const row = await prisma.eSignRequest.create({
          data: {
            externalId,
            caseId: req.caseId,
            documentTitle: req.documentTitle,
            signerName: req.signerName,
            signerEmail: req.signerEmail,
            signerPhone: req.signerPhone,
            documentUrl: req.documentUrl,
            templateId: req.templateId,
            provider: "MODUSIGN",
            status: "PENDING",
            signUrl: participantUrl,
            internalToken,
            expiresAt,
            rawProviderJson: JSON.stringify(data).slice(0, 4000),
          },
        });
        return { requestId: row.id, signUrl: participantUrl, externalId };
      }
      const body = await res.text();
      logger.error("[e-signature] Modusign error", res.status, body);
      captureError(new Error(`Modusign ${res.status}`), { body });
    } catch (err) {
      captureError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  // 2) in-memory MVP 폴백 (DB 저장은 그대로)
  const row = await prisma.eSignRequest.create({
    data: {
      caseId: req.caseId,
      documentTitle: req.documentTitle,
      signerName: req.signerName,
      signerEmail: req.signerEmail,
      signerPhone: req.signerPhone,
      documentUrl: req.documentUrl,
      templateId: req.templateId,
      provider: "IN_MEMORY",
      status: "PENDING",
      internalToken,
      expiresAt,
    },
  });
  const signUrl = `${siteUrl()}/sign/${row.id}?token=${internalToken}`;
  await prisma.eSignRequest.update({
    where: { id: row.id },
    data: { signUrl },
  });
  return { requestId: row.id, signUrl };
}

// ---------------------------------------------------------------------------
// Verify (in-memory MVP click-through)
// ---------------------------------------------------------------------------

export async function verifySignature(
  requestId: string,
  token: string
): Promise<boolean> {
  const row = await prisma.eSignRequest
    .findUnique({ where: { id: requestId } })
    .catch(() => null);
  if (!row) return false;
  try {
    const a = Buffer.from(row.internalToken);
    const b = Buffer.from(token);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  await prisma.eSignRequest.update({
    where: { id: requestId },
    data: { status: "SIGNED", signedAt: new Date() },
  });
  return true;
}

// ---------------------------------------------------------------------------
// Status (with optional Modusign refresh)
// ---------------------------------------------------------------------------

export async function refreshSignatureStatusFromProvider(
  requestId: string
): Promise<"PENDING" | "SIGNED" | "REJECTED" | "EXPIRED" | null> {
  const row = await prisma.eSignRequest
    .findUnique({ where: { id: requestId } })
    .catch(() => null);
  if (!row || !row.externalId) return null;
  const cfg = getModusignConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(`${MODUSIGN_BASE}/documents/${row.externalId}`, {
      headers: { Authorization: authHeader(cfg) },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const status: string = data.status ?? "";
    let nextStatus: "PENDING" | "SIGNED" | "REJECTED" | "EXPIRED" = "PENDING";
    if (status === "COMPLETED" || status === "SIGNED") nextStatus = "SIGNED";
    else if (status === "REJECTED" || status === "CANCELED") nextStatus = "REJECTED";
    else if (status === "EXPIRED") nextStatus = "EXPIRED";

    await prisma.eSignRequest.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
        signedAt: nextStatus === "SIGNED" ? new Date() : row.signedAt,
        rawProviderJson: JSON.stringify(data).slice(0, 4000),
      },
    });
    return nextStatus;
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)));
    return null;
  }
}

export async function getSignatureStatus(
  requestId: string
): Promise<"PENDING" | "SIGNED" | "REJECTED" | "EXPIRED" | "NOT_FOUND"> {
  const row = await prisma.eSignRequest
    .findUnique({ where: { id: requestId } })
    .catch(() => null);
  if (!row) return "NOT_FOUND";
  if (row.status === "PENDING" && row.expiresAt && row.expiresAt < new Date()) {
    await prisma.eSignRequest.update({
      where: { id: requestId },
      data: { status: "EXPIRED" },
    });
    return "EXPIRED";
  }
  return row.status;
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

export function verifyModusignWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.MODUSIGN_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // fail-closed: 시크릿 없으면 위조 웹훅으로 서명상태 조작 가능 → 거부.
    logger.warn("[e-signature] MODUSIGN_WEBHOOK_SECRET 미설정 — 웹훅 거부(fail-closed)");
    return false;
  }
  if (!signature) return false;
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function applyWebhookStatus(
  externalId: string,
  status: "SIGNED" | "REJECTED" | "EXPIRED"
): Promise<boolean> {
  try {
    const result = await prisma.eSignRequest.updateMany({
      where: { externalId },
      data: {
        status,
        signedAt: status === "SIGNED" ? new Date() : undefined,
      },
    });
    return result.count > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// List (admin UI)
// ---------------------------------------------------------------------------

export type SignatureUIStatus =
  | "pending"
  | "signed"
  | "expired"
  | "rejected"
  | "not_found";

export interface SignatureRequestSummary {
  requestId: string;
  documentTitle: string;
  signerName: string;
  signerEmail: string;
  status: SignatureUIStatus;
  createdAt: string;
  signedAt?: string;
  externalId?: string;
  provider: "modusign" | "in-memory";
}

function toUiStatus(s: string): SignatureUIStatus {
  switch (s) {
    case "SIGNED":
      return "signed";
    case "REJECTED":
      return "rejected";
    case "EXPIRED":
      return "expired";
    case "PENDING":
      return "pending";
    default:
      return "not_found";
  }
}

export async function listSignatureRequests(): Promise<SignatureRequestSummary[]> {
  try {
    const rows = await prisma.eSignRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map((r) => ({
      requestId: r.id,
      documentTitle: r.documentTitle,
      signerName: r.signerName,
      signerEmail: r.signerEmail,
      status: toUiStatus(r.status),
      createdAt: r.createdAt.toISOString(),
      signedAt: r.signedAt?.toISOString() ?? undefined,
      externalId: r.externalId ?? undefined,
      provider: r.provider === "MODUSIGN" ? "modusign" : "in-memory",
    }));
  } catch {
    return [];
  }
}
