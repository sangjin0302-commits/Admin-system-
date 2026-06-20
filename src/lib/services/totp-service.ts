import crypto from "node:crypto";

// Base32 (RFC 4648) encoding without padding for the secret representation.
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateSecret(): string {
  const bytes = crypto.randomBytes(20);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length && out.length < 32; i += 5) {
    out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  while (out.length < 32) {
    out += BASE32_ALPHABET[Math.floor(Math.random() * 32)];
  }
  return out.slice(0, 32);
}

function base32Decode(secret: string): Buffer {
  const clean = secret.toUpperCase().replace(/=+$/g, "").replace(/\s/g, "");
  let bits = "";
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function getOtpauthUrl(secret: string, accountName: string, issuer: string): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  // 64-bit big-endian counter
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, "0");
}

export function generateTotp(secret: string, time?: number): string {
  const t = Math.floor((time ?? Date.now()) / 1000 / 30);
  return hotp(secret, t);
}

export function verifyTotp(secret: string, token: string, windowSize = 1): boolean {
  if (!token || !/^\d{6}$/.test(token)) return false;
  const t = Math.floor(Date.now() / 1000 / 30);
  for (let w = -windowSize; w <= windowSize; w++) {
    if (hotp(secret, t + w) === token) return true;
  }
  return false;
}
