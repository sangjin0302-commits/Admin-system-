/**
 * Electronic signature workflow service.
 *
 * Default driver: in-memory (개발/MVP용).
 * Production driver: 모두싸인 (Modusign) — MODUSIGN_API_KEY + MODUSIGN_USER_EMAIL 설정 시 자동 활성.
 *
 * 모두싸인 API 문서: https://docs.modusign.co.kr
 *   - POST /documents/request-with-template  (템플릿 기반 서명 요청)
 *   - GET  /documents/:id                    (상태 조회)
 *
 * 외부 SDK 없이 fetch만 사용 — 의존성 추가 없음.
 */

import { randomUUID, createHmac, timingSafeEqual } from "crypto";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";

export interface SignatureRequest {
  documentTitle: string;
  signerName: string;
  signerEmail: string;
  signerPhone?: string;
  documentUrl?: string;
  /** 모두싸인 템플릿 ID (사전 등록 필요). 미지정 시 in-memory 모드. */
  templateId?: string;
}

interface StoredRequest {
  id: string;
  token: string;
  status: "pending" | "signed" | "expired" | "rejected";
  request: SignatureRequest;
  createdAt: Date;
  /** 모두싸인 외부 ID (있을 경우). */
  externalId?: string;
  signedAt?: Date;
}

const store = new Map<string, StoredRequest>();
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

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createSignatureRequest(
  req: SignatureRequest
): Promise<{ requestId: string; signUrl: string; externalId?: string }> {
  const id = randomUUID();
  const token = randomUUID();
  const cfg = getModusignConfig();

  // 모두싸인 활성 + templateId 있으면 외부 발송
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
              signingMethod: {
                type: "EMAIL",
                value: req.signerEmail,
              },
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
        store.set(id, {
          id,
          token,
          status: "pending",
          request: req,
          createdAt: new Date(),
          externalId,
        });
        return { requestId: id, signUrl: participantUrl, externalId };
      }
      const body = await res.text();
      logger.error("[e-signature] Modusign error", res.status, body);
      captureError(new Error(`Modusign ${res.status}`), { body });
      // fallthrough: in-memory MVP
    } catch (err) {
      captureError(err instanceof Error ? err : new Error(String(err)));
      // fallthrough
    }
  }

  store.set(id, {
    id,
    token,
    status: "pending",
    request: req,
    createdAt: new Date(),
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000";
  const signUrl = `${baseUrl}/sign/${id}?token=${token}`;

  return { requestId: id, signUrl };
}

// ---------------------------------------------------------------------------
// Verify (in-memory MVP click-through)
// ---------------------------------------------------------------------------

export async function verifySignature(
  requestId: string,
  token: string
): Promise<boolean> {
  const entry = store.get(requestId);
  if (!entry) return false;
  try {
    const a = Buffer.from(entry.token);
    const b = Buffer.from(token);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  entry.status = "signed";
  entry.signedAt = new Date();
  return true;
}

// ---------------------------------------------------------------------------
// Status (with optional Modusign refresh)
// ---------------------------------------------------------------------------

export async function refreshSignatureStatusFromProvider(
  requestId: string
): Promise<StoredRequest["status"] | null> {
  const entry = store.get(requestId);
  if (!entry || !entry.externalId) return null;
  const cfg = getModusignConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(`${MODUSIGN_BASE}/documents/${entry.externalId}`, {
      headers: { Authorization: authHeader(cfg) },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const status: string = data.status ?? "";
    if (status === "COMPLETED" || status === "SIGNED") {
      entry.status = "signed";
      entry.signedAt = new Date();
    } else if (status === "REJECTED" || status === "CANCELED") {
      entry.status = "rejected";
    } else if (status === "EXPIRED") {
      entry.status = "expired";
    }
    return entry.status;
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)));
    return null;
  }
}

export function getSignatureStatus(
  requestId: string
): "pending" | "signed" | "expired" | "rejected" | "not_found" {
  const entry = store.get(requestId);
  if (!entry) return "not_found";

  if (entry.status === "pending") {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - entry.createdAt.getTime() > sevenDays) {
      entry.status = "expired";
    }
  }
  return entry.status;
}

// ---------------------------------------------------------------------------
// Webhook signature verification (Modusign)
// ---------------------------------------------------------------------------

export function verifyModusignWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.MODUSIGN_WEBHOOK_SECRET?.trim();
  if (!secret) {
    logger.warn(
      "[e-signature] MODUSIGN_WEBHOOK_SECRET 미설정 — 웹훅 시그니처 검증 건너뜁니다."
    );
    return true;
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

export function applyWebhookStatus(
  externalId: string,
  status: "signed" | "rejected" | "expired"
): boolean {
  for (const entry of store.values()) {
    if (entry.externalId === externalId) {
      entry.status = status;
      if (status === "signed") entry.signedAt = new Date();
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// List (for admin UI)
// ---------------------------------------------------------------------------

export interface SignatureRequestSummary {
  requestId: string;
  documentTitle: string;
  signerName: string;
  signerEmail: string;
  status: ReturnType<typeof getSignatureStatus>;
  createdAt: string;
  signedAt?: string;
  externalId?: string;
  provider: "modusign" | "in-memory";
}

export function listSignatureRequests(): SignatureRequestSummary[] {
  return Array.from(store.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((entry) => ({
      requestId: entry.id,
      documentTitle: entry.request.documentTitle,
      signerName: entry.request.signerName,
      signerEmail: entry.request.signerEmail,
      status: getSignatureStatus(entry.id),
      createdAt: entry.createdAt.toISOString(),
      signedAt: entry.signedAt?.toISOString(),
      externalId: entry.externalId,
      provider: entry.externalId ? "modusign" : "in-memory",
    }));
}
