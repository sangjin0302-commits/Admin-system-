import crypto from "node:crypto";

const TOKEN_BYTES = 32;
const TTL_MS = 60 * 60 * 1000; // 1시간

export function generateResetToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + TTL_MS);
  return { rawToken, tokenHash, expiresAt };
}

export function hashResetToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
