/**
 * Customer referral program.
 *
 * Storage: Prisma (CustomerReferral + CustomerReferralUse).
 * Previously an in-memory Map/array that was wiped on every serverless cold
 * start, which made /admin/referrals effectively non-functional. Now persisted.
 *
 * Separate from the B2B partner referral program (partner-referral-service.ts,
 * SiteSetting JSON blobs).
 */

import { prisma } from "@/lib/prisma/client";

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

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REWARD_PER_USE = 50000;

function generateCodeString(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

async function codeExists(code: string): Promise<boolean> {
  const found = await prisma.customerReferral
    .findUnique({ where: { code }, select: { id: true } })
    .catch(() => null);
  return Boolean(found);
}

export async function generateReferralCode(
  referrerEmail: string,
  referrerName: string
): Promise<ReferralCode> {
  let code = generateCodeString();
  // Avoid the (extremely unlikely) collision on the unique code column.
  while (await codeExists(code)) {
    code = generateCodeString();
  }
  const rec = await prisma.customerReferral.create({
    data: {
      code,
      referrerEmail,
      referrerName,
      usageCount: 0,
      rewardAmount: 0,
    },
  });
  return {
    code: rec.code,
    referrerEmail: rec.referrerEmail,
    referrerName: rec.referrerName,
    createdAt: rec.createdAt,
    usageCount: rec.usageCount,
    rewardAmount: rec.rewardAmount,
  };
}

export async function validateCode(code: string): Promise<ReferralCode | null> {
  const rec = await prisma.customerReferral
    .findUnique({ where: { code } })
    .catch(() => null);
  if (!rec) return null;
  return {
    code: rec.code,
    referrerEmail: rec.referrerEmail,
    referrerName: rec.referrerName,
    createdAt: rec.createdAt,
    usageCount: rec.usageCount,
    rewardAmount: rec.rewardAmount,
  };
}

export async function recordReferralUse(
  code: string,
  refereeEmail: string,
  refereeInquiryId: string
): Promise<boolean> {
  const exists = await codeExists(code);
  if (!exists) return false;
  try {
    await prisma.$transaction([
      prisma.customerReferralUse.create({
        data: {
          code,
          refereeEmail,
          refereeInquiryId,
          rewardPaid: false,
        },
      }),
      prisma.customerReferral.update({
        where: { code },
        data: {
          usageCount: { increment: 1 },
          rewardAmount: { increment: REWARD_PER_USE },
        },
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function listCodes(): Promise<ReferralCode[]> {
  const rows = await prisma.customerReferral
    .findMany({ orderBy: { createdAt: "desc" } })
    .catch(() => []);
  return rows.map((rec) => ({
    code: rec.code,
    referrerEmail: rec.referrerEmail,
    referrerName: rec.referrerName,
    createdAt: rec.createdAt,
    usageCount: rec.usageCount,
    rewardAmount: rec.rewardAmount,
  }));
}

export async function getReferralStats(): Promise<{
  totalCodes: number;
  totalUses: number;
  topReferrers: { email: string; uses: number }[];
}> {
  const [totalCodes, totalUses, grouped] = await Promise.all([
    prisma.customerReferral.count().catch(() => 0),
    prisma.customerReferralUse.count().catch(() => 0),
    prisma.customerReferral
      .groupBy({
        by: ["referrerEmail"],
        _sum: { usageCount: true },
      })
      .catch(() => [] as { referrerEmail: string; _sum: { usageCount: number | null } }[]),
  ]);

  const topReferrers = grouped
    .map((g) => ({ email: g.referrerEmail, uses: g._sum.usageCount ?? 0 }))
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 10);

  return { totalCodes, totalUses, topReferrers };
}
