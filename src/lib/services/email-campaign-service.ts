import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  targetSegment: "all" | "won" | "active" | "new";
  createdAt: Date;
  sentAt?: Date;
  status: "draft" | "scheduled" | "sent";
  recipientCount: number;
};

const campaigns = new Map<string, Campaign>();

function genId(): string {
  return `camp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createCampaign(
  c: Omit<Campaign, "id" | "createdAt" | "status" | "recipientCount">
): Campaign {
  const campaign: Campaign = {
    ...c,
    id: genId(),
    createdAt: new Date(),
    status: "draft",
    recipientCount: 0,
  };
  campaigns.set(campaign.id, campaign);
  return campaign;
}

export function listCampaigns(): Campaign[] {
  return Array.from(campaigns.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export function getCampaign(id: string): Campaign | undefined {
  return campaigns.get(id);
}

export async function getRecipients(
  segment: string
): Promise<{ email: string; name: string }[]> {
  const where: Record<string, unknown> = {};
  switch (segment) {
    case "won":
      where.status = "WON";
      break;
    case "active":
      where.status = { in: ["NEW", "IN_PROGRESS", "QUALIFIED"] };
      break;
    case "new":
      where.status = "NEW";
      break;
    case "all":
    default:
      break;
  }
  try {
    const rows = await prisma.inquiry.findMany({
      where,
      select: { email: true, contactName: true },
      take: 5000,
    });
    const seen = new Set<string>();
    const out: { email: string; name: string }[] = [];
    for (const r of rows) {
      if (!r.email || seen.has(r.email)) continue;
      seen.add(r.email);
      out.push({ email: r.email, name: r.contactName ?? "" });
    }
    return out;
  } catch (error) {
    logger.error("[email-campaign] getRecipients failed", error);
    return [];
  }
}

export async function sendCampaign(
  id: string
): Promise<{ sent: number; errors: number }> {
  const campaign = campaigns.get(id);
  if (!campaign) {
    return { sent: 0, errors: 1 };
  }
  const recipients = await getRecipients(campaign.targetSegment);
  campaign.recipientCount = recipients.length;

  let sent = 0;
  let errors = 0;
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    const from = process.env.RESEND_FROM ?? "noreply@ethosattorney.com";
    for (const r of recipients) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from,
            to: r.email,
            subject: campaign.subject,
            html: campaign.bodyHtml,
          }),
        });
        if (res.ok) sent++;
        else errors++;
      } catch {
        errors++;
      }
    }
  } else {
    sent = recipients.length;
  }

  campaign.status = "sent";
  campaign.sentAt = new Date();
  campaigns.set(id, campaign);
  return { sent, errors };
}
