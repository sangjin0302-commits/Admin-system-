import { prisma } from "@/lib/prisma/client";

export type SimilarInquiry = {
  id: string;
  title: string;
  contactName: string | null;
  status: string;
  category: string | null;
  createdAt: Date;
  keyIssues: string[];
  matchScore: number;
  matchedIssues: string[];
};

export async function findSimilarInquiries(
  targetIssues: string[],
  excludeId?: string,
  limit = 5
): Promise<SimilarInquiry[]> {
  if (targetIssues.length === 0) return [];

  const targetSet = new Set(targetIssues.map((i) => i.toLowerCase().trim()));

  const inquiries = await prisma.inquiry.findMany({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      lawbotSnapshotPayload: { not: null }
    },
    select: {
      id: true,
      title: true,
      contactName: true,
      status: true,
      intakeCategory: true,
      createdAt: true,
      lawbotSnapshotPayload: true
    },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  const scored: SimilarInquiry[] = [];

  for (const inq of inquiries) {
    try {
      if (!inq.lawbotSnapshotPayload) continue;
      const payload = JSON.parse(inq.lawbotSnapshotPayload as string);
      const rawIssues = payload?.key_issues ?? payload?.payload?.key_issues;
      const keyIssues: string[] = Array.isArray(rawIssues)
        ? rawIssues.map((s: unknown) => String(s))
        : [];

      const matched = keyIssues.filter((issue) =>
        targetSet.has(issue.toLowerCase().trim())
      );

      if (matched.length === 0) continue;

      const score =
        matched.length / Math.max(targetIssues.length, keyIssues.length);

      scored.push({
        id: inq.id,
        title: inq.title,
        contactName: inq.contactName,
        status: String(inq.status),
        category: inq.intakeCategory,
        createdAt: inq.createdAt,
        keyIssues,
        matchScore: Math.round(score * 100),
        matchedIssues: matched
      });
    } catch {
      continue;
    }
  }

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}

export function extractKeyIssuesFromSnapshotPayload(
  payload: string | null | undefined
): string[] {
  if (!payload) return [];
  try {
    const parsed = JSON.parse(payload);
    const raw = parsed?.key_issues ?? parsed?.payload?.key_issues;
    if (!Array.isArray(raw)) return [];
    return raw.map((s: unknown) => String(s));
  } catch {
    return [];
  }
}
