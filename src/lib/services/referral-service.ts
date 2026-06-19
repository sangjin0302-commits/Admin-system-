export type ReferralCode = {
  code: string;
  referrerEmail: string;
  referrerName: string;
  createdAt: Date;
  usageCount: number;
  rewardAmount: number;
};

export type ReferralUse = {
  code: string;
  refereeEmail: string;
  refereeInquiryId: string;
  usedAt: Date;
  rewardPaid: boolean;
};

const codes = new Map<string, ReferralCode>();
const uses: ReferralUse[] = [];

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCodeString(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function generateReferralCode(
  referrerEmail: string,
  referrerName: string
): ReferralCode {
  let code = generateCodeString();
  while (codes.has(code)) {
    code = generateCodeString();
  }
  const rec: ReferralCode = {
    code,
    referrerEmail,
    referrerName,
    createdAt: new Date(),
    usageCount: 0,
    rewardAmount: 0,
  };
  codes.set(code, rec);
  return rec;
}

export function validateCode(code: string): ReferralCode | null {
  return codes.get(code) ?? null;
}

export function recordReferralUse(
  code: string,
  refereeEmail: string,
  refereeInquiryId: string
): boolean {
  const rec = codes.get(code);
  if (!rec) return false;
  uses.push({
    code,
    refereeEmail,
    refereeInquiryId,
    usedAt: new Date(),
    rewardPaid: false,
  });
  rec.usageCount += 1;
  rec.rewardAmount += 50000;
  codes.set(code, rec);
  return true;
}

export function listCodes(): ReferralCode[] {
  return Array.from(codes.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export function getReferralStats(): {
  totalCodes: number;
  totalUses: number;
  topReferrers: { email: string; uses: number }[];
} {
  const counts = new Map<string, number>();
  for (const c of codes.values()) {
    counts.set(c.referrerEmail, (counts.get(c.referrerEmail) ?? 0) + c.usageCount);
  }
  const topReferrers = Array.from(counts.entries())
    .map(([email, uses]) => ({ email, uses }))
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 10);
  return {
    totalCodes: codes.size,
    totalUses: uses.length,
    topReferrers,
  };
}
