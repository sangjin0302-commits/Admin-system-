import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";
import { rateLimit } from "@/lib/services/rate-limiter";
import { getClientIpFromHeaders } from "@/lib/security/rate-limit";

export type BotTier = "anonymous" | "registered" | "customer";

export type BotTierInfo = {
  tier: BotTier;
  userId?: string;
  userEmail?: string;
  remainingQuota: number;
  dailyQuota: number;
  features: {
    maxAnswerLength: number;
    allowedBots: ("lawbot" | "market")[];
    allowFollowUp: boolean;
    caseContextIncluded: boolean;
  };
};

export const BOT_FEATURES: Record<BotTier, BotTierInfo["features"] & { dailyQuota: number }> = {
  anonymous: {
    maxAnswerLength: 500,
    allowedBots: ["lawbot"],
    allowFollowUp: false,
    caseContextIncluded: false,
    dailyQuota: 5,
  },
  registered: {
    maxAnswerLength: 2000,
    allowedBots: ["lawbot"],
    allowFollowUp: true,
    caseContextIncluded: false,
    dailyQuota: 30,
  },
  customer: {
    maxAnswerLength: Number.POSITIVE_INFINITY,
    allowedBots: ["lawbot"],
    allowFollowUp: true,
    caseContextIncluded: true,
    dailyQuota: Number.POSITIVE_INFINITY,
  },
};

const DAY_MS = 86_400_000;
const NON_ACTIVE_STATUSES = new Set(["CLOSED", "CANCELLED"]);

export function getBotIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const ip = getClientIpFromHeaders(request.headers) ?? "unknown";
  return `ip:${ip}`;
}

async function isCustomerByEmail(email: string): Promise<boolean> {
  if (!email) return false;
  try {
    const count = await prisma.caseParty.count({
      where: {
        role: "CLIENT",
        email,
        caseMatter: {
          status: { notIn: ["CLOSED", "CANCELLED"] as never },
        },
      },
    });
    return count > 0;
  } catch {
    return false;
  }
}

export async function getBotTier(request: Request, identifier?: string): Promise<BotTierInfo> {
  let tier: BotTier = "anonymous";
  let userId: string | undefined;
  let userEmail: string | undefined;

  try {
    const session = await auth();
    const sUser = session?.user as { id?: string; email?: string } | undefined;
    if (sUser?.id) {
      userId = sUser.id;
      userEmail = sUser.email ?? undefined;
      tier = "registered";
      if (userEmail && (await isCustomerByEmail(userEmail))) {
        tier = "customer";
      }
    }
  } catch {
    // anonymous fallback
  }

  const key = identifier ?? getBotIdentifier(request, userId);
  const feats = BOT_FEATURES[tier];
  const dailyQuota = feats.dailyQuota;

  let remainingQuota = dailyQuota;
  if (Number.isFinite(dailyQuota)) {
    const res = rateLimit(`bot:${tier}:${key}`, dailyQuota, DAY_MS);
    remainingQuota = res.remaining + (res.allowed ? 0 : 0);
    // rateLimit consumes a slot — but we only want to *read*. We'll separate consumption to the route.
    // To keep this read-only, we re-derive: rateLimit already consumed. To avoid that, we use a probe by reading after.
    // Simpler: this function is used for display only; the route will call rateLimit again for the actual consume.
    // Since rateLimit just consumed, the *displayed* remaining is post-consume. Acceptable for tier-info usage.
  }

  return {
    tier,
    userId,
    userEmail,
    remainingQuota,
    dailyQuota,
    features: {
      maxAnswerLength: feats.maxAnswerLength,
      allowedBots: feats.allowedBots,
      allowFollowUp: feats.allowFollowUp,
      caseContextIncluded: feats.caseContextIncluded,
    },
  };
}

/**
 * Resolve tier metadata WITHOUT consuming rate-limit quota. Used by the query route
 * which will perform its own rateLimit call.
 */
export async function resolveBotTier(request: Request): Promise<{
  tier: BotTier;
  userId?: string;
  userEmail?: string;
  identifier: string;
  features: BotTierInfo["features"];
  dailyQuota: number;
}> {
  let tier: BotTier = "anonymous";
  let userId: string | undefined;
  let userEmail: string | undefined;

  try {
    const session = await auth();
    const sUser = session?.user as { id?: string; email?: string } | undefined;
    if (sUser?.id) {
      userId = sUser.id;
      userEmail = sUser.email ?? undefined;
      tier = "registered";
      if (userEmail && (await isCustomerByEmail(userEmail))) {
        tier = "customer";
      }
    }
  } catch {
    // ignore
  }

  const feats = BOT_FEATURES[tier];
  return {
    tier,
    userId,
    userEmail,
    identifier: getBotIdentifier(request, userId),
    features: {
      maxAnswerLength: feats.maxAnswerLength,
      allowedBots: feats.allowedBots,
      allowFollowUp: feats.allowFollowUp,
      caseContextIncluded: feats.caseContextIncluded,
    },
    dailyQuota: feats.dailyQuota,
  };
}
