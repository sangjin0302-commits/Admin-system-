/**
 * Electronic signature workflow service (MVP).
 *
 * For the MVP this uses an in-memory store keyed by requestId.
 * Production would integrate with DocuSign or Modusign.
 */

import { randomUUID } from "crypto";

export interface SignatureRequest {
  documentTitle: string;
  signerName: string;
  signerEmail: string;
  documentUrl?: string;
}

interface StoredRequest {
  id: string;
  token: string;
  status: "pending" | "signed" | "expired";
  request: SignatureRequest;
  createdAt: Date;
}

// In-memory store — replaced by DB in production
const store = new Map<string, StoredRequest>();

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createSignatureRequest(
  req: SignatureRequest
): Promise<{ requestId: string; signUrl: string }> {
  const id = randomUUID();
  const token = randomUUID();

  store.set(id, {
    id,
    token,
    status: "pending",
    request: req,
    createdAt: new Date(),
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const signUrl = `${baseUrl}/sign/${id}?token=${token}`;

  return { requestId: id, signUrl };
}

// ---------------------------------------------------------------------------
// Verify
// ---------------------------------------------------------------------------

export async function verifySignature(
  requestId: string,
  token: string
): Promise<boolean> {
  const entry = store.get(requestId);
  if (!entry) return false;
  if (entry.token !== token) return false;

  entry.status = "signed";
  return true;
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export function getSignatureStatus(
  requestId: string
): "pending" | "signed" | "expired" | "not_found" {
  const entry = store.get(requestId);
  if (!entry) return "not_found";

  // Expire after 7 days
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - entry.createdAt.getTime() > sevenDays) {
    entry.status = "expired";
  }

  return entry.status;
}

// ---------------------------------------------------------------------------
// List (for admin UI)
// ---------------------------------------------------------------------------

export interface SignatureRequestSummary {
  requestId: string;
  documentTitle: string;
  signerName: string;
  signerEmail: string;
  status: "pending" | "signed" | "expired" | "not_found";
  createdAt: string;
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
    }));
}
