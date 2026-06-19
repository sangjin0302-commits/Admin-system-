import { prisma } from "@/lib/prisma/client";

export type IndexReport = {
  existingIndexes: string[];
  recommendations: {
    table: string;
    columns: string[];
    reason: string;
  }[];
  queryPatterns: {
    name: string;
    description: string;
  }[];
};

export async function analyzeIndexes(): Promise<IndexReport> {
  const existingIndexes = [
    "Inquiry.createdAt",
    "Inquiry.status",
    "CaseMatter.createdAt",
    "CaseMatter.status",
    "BlogPost.publishedAt",
    "CaseEvent.matterId",
    "PortalNotification.recipientId"
  ];

  const recommendations: IndexReport["recommendations"] = [
    {
      table: "Inquiry",
      columns: ["email", "status"],
      reason:
        "Lookups by email combined with status filtering are common in CRM duplicate-detection and follow-up queues."
    },
    {
      table: "Inquiry",
      columns: ["assignedTo", "status", "createdAt"],
      reason:
        "Operational queues filter by assignee + status and sort by recency; a composite index avoids scans."
    },
    {
      table: "CaseMatter",
      columns: ["assignedTo", "status"],
      reason:
        "Case workload dashboards filter by assigned lawyer and status frequently."
    },
    {
      table: "CaseMatter",
      columns: ["clientId", "status"],
      reason:
        "Client portal needs all open matters for a client; covered index improves portal load times."
    },
    {
      table: "CaseEvent",
      columns: ["matterId", "occurredAt"],
      reason:
        "Timeline rendering scans events for a matter ordered by time."
    },
    {
      table: "BlogPost",
      columns: ["status", "publishedAt"],
      reason:
        "Public blog list filters published posts ordered by publishedAt."
    },
    {
      table: "PortalNotification",
      columns: ["recipientId", "readAt"],
      reason:
        "Unread-notification badges read by (recipient, readAt IS NULL)."
    }
  ];

  const queryPatterns: IndexReport["queryPatterns"] = [
    {
      name: "Inquiry queue by assignee",
      description:
        "WHERE assignedTo = ? AND status IN (...) ORDER BY createdAt DESC"
    },
    {
      name: "Case matter list by lawyer",
      description: "WHERE assignedTo = ? AND status = ? ORDER BY updatedAt DESC"
    },
    {
      name: "Unread notifications",
      description: "WHERE recipientId = ? AND readAt IS NULL"
    },
    {
      name: "Published blog feed",
      description:
        "WHERE status = 'PUBLISHED' AND publishedAt <= now() ORDER BY publishedAt DESC"
    },
    {
      name: "Matter timeline",
      description: "WHERE matterId = ? ORDER BY occurredAt DESC"
    }
  ];

  return { existingIndexes, recommendations, queryPatterns };
}

export function getSlowQueryHints(): { table: string; suggestion: string }[] {
  return [
    {
      table: "Inquiry",
      suggestion:
        "Avoid SELECT * for list views; project only columns used by the table component."
    },
    {
      table: "CaseMatter",
      suggestion:
        "Use cursor pagination (id-based) instead of offset on large case lists."
    },
    {
      table: "CaseEvent",
      suggestion:
        "Batch event inserts inside a single prisma.$transaction when bulk-importing timelines."
    },
    {
      table: "BlogPost",
      suggestion:
        "Cache published feed for 60s (see cacheService) — content changes rarely vs. read volume."
    },
    {
      table: "PortalNotification",
      suggestion:
        "Add a partial index for unread notifications if your DB supports it."
    }
  ];
}

export async function getDbSize(): Promise<{
  tables: { name: string; rowCount: number }[];
}> {
  const safeCount = async (
    name: string,
    fn: () => Promise<number>
  ): Promise<{ name: string; rowCount: number }> => {
    try {
      const rowCount = await fn();
      return { name, rowCount };
    } catch {
      return { name, rowCount: -1 };
    }
  };

  const tables = await Promise.all([
    safeCount("Inquiry", () => prisma.inquiry.count()),
    safeCount("CaseMatter", () => prisma.caseMatter.count()),
    safeCount("BlogPost", () => prisma.blogPost.count()),
    safeCount("CaseEvent", () => prisma.caseEvent.count()),
    safeCount("PortalNotification", () => prisma.portalNotification.count())
  ]);

  return { tables };
}
