import { prisma } from "@/lib/prisma/client";

export type NextAction = {
  inquiryId: string;
  inquiryTitle: string;
  contactName: string | null;
  action: string;
  urgency: "high" | "medium" | "low";
  source: "lawbot" | "system";
};

export async function getTopNextActions(limit = 10): Promise<NextAction[]> {
  const inquiries = await prisma.inquiry.findMany({
    where: {
      status: {
        in: [
          "NEW",
          "PRE_DIAGNOSED",
          "CONSULTATION_REQUIRED",
          "QUOTE_DRAFTED",
          "QUOTE_PENDING",
          "IN_REVIEW",
          "WAITING_CONSULTATION",
          "QUOTE_SENT",
        ],
      },
      lawbotSnapshotPayload: { not: null },
    },
    select: {
      id: true,
      title: true,
      contactName: true,
      status: true,
      urgencyLevel: true,
      lawbotSnapshotPayload: true,
      dueDate: true,
      updatedAt: true,
    },
    take: 100,
  });

  const actions: NextAction[] = [];

  for (const inq of inquiries) {
    try {
      const payload = JSON.parse(inq.lawbotSnapshotPayload as string);
      const priorityActions: string[] = Array.isArray(payload.priority_actions)
        ? payload.priority_actions.slice(0, 2)
        : [];

      const daysSinceUpdate = Math.floor(
        (Date.now() - inq.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      const dueSoon =
        inq.dueDate &&
        inq.dueDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

      for (const action of priorityActions) {
        actions.push({
          inquiryId: inq.id,
          inquiryTitle: inq.title,
          contactName: inq.contactName,
          action: String(action),
          urgency:
            dueSoon || inq.urgencyLevel === "CRITICAL"
              ? "high"
              : daysSinceUpdate > 3
                ? "medium"
                : "low",
          source: "lawbot",
        });
      }
    } catch {
      continue;
    }
  }

  actions.sort((a, b) => {
    const urgOrder = { high: 0, medium: 1, low: 2 };
    return urgOrder[a.urgency] - urgOrder[b.urgency];
  });

  return actions.slice(0, limit);
}
