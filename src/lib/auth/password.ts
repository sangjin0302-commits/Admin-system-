import bcrypt from "bcryptjs";

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function validatePasswordStrength(plain: string): { ok: boolean; reason?: string } {
  if (plain.length < 10) return { ok: false, reason: "비밀번호는 10자 이상이어야 합니다." };
  if (!/[a-zA-Z]/.test(plain)) return { ok: false, reason: "비밀번호에 영문자가 포함되어야 합니다." };
  if (!/[0-9]/.test(plain)) return { ok: false, reason: "비밀번호에 숫자가 포함되어야 합니다." };
  return { ok: true };
}
