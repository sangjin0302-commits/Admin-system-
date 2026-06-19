import { prisma } from "@/lib/prisma/client";

export type ChurnRisk = "low" | "medium" | "high";

export type CustomerLTV = {
  email: string;
  name: string;
  firstContactDate: Date;
  totalRevenue: number;
  caseCount: number;
  avgCaseValue: number;
  predictedLifetimeMonths: number;
  predictedLTV: number;
  churnRisk: ChurnRisk;
  lastActivityDate: Date;
};

export function predictChurnRisk(
  daysSinceLastActivity: number,
  caseCount: number,
): ChurnRisk {
  // Engaged repeat buyers (3+ cases) tolerate longer silences.
  if (caseCount >= 3) {
    if (daysSinceLastActivity > 365) return "high";
    if (daysSinceLastActivity > 180) return "medium";
    return "low";
  }
  if (caseCount === 2) {
    if (daysSinceLastActivity > 270) return "high";
    if (daysSinceLastActivity > 120) return "medium";
    return "low";
  }
  // Single-case customers churn fast.
  if (daysSinceLastActivity > 180) return "high";
  if (daysSinceLastActivity > 90) return "medium";
  return "low";
}

function engagementFactor(caseCount: number): number {
  if (caseCount >= 5) return 1.8;
  if (caseCount >= 3) return 1.5;
  if (caseCount === 2) return 1.2;
  return 1.0;
}

function predictedLifetimeMonths(caseCount: number, churnRisk: ChurnRisk): number {
  // Base lifetime expectation in months, adjusted by churn.
  const base = caseCount >= 3 ? 36 : caseCount === 2 ? 24 : 12;
  const churnMultiplier =
    churnRisk === "high" ? 0.4 : churnRisk === "medium" ? 0.75 : 1.0;
  return Math.round(base * churnMultiplier);
}

type AggregatedCustomer = {
  email: string;
  name: string;
  firstContactDate: Date;
  lastActivityDate: Date;
  totalRevenue: number;
  caseCount: number;
};

async function aggregateCustomers(
  emailFilter?: string,
): Promise<Map<string, AggregatedCustomer>> {
  const inquiries = await prisma.inquiry.findMany({
    where: emailFilter ? { email: emailFilter } : undefined,
    select: {
      email: true,
      contactName: true,
      createdAt: true,
      updatedAt: true,
      caseMatters: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          accountingMemo: {
            select: { paidAmount: true, paidAt: true },
          },
        },
      },
    },
  });

  const byEmail = new Map<string, AggregatedCustomer>();

  for (const inq of inquiries) {
    if (!inq.email) continue;
    const key = inq.email.toLowerCase();
    const existing = byEmail.get(key) ?? {
      email: inq.email,
      name: inq.contactName,
      firstContactDate: inq.createdAt,
      lastActivityDate: inq.updatedAt ?? inq.createdAt,
      totalRevenue: 0,
      caseCount: 0,
    };

    if (inq.createdAt < existing.firstContactDate) {
      existing.firstContactDate = inq.createdAt;
    }
    const inqLast = inq.updatedAt ?? inq.createdAt;
    if (inqLast > existing.lastActivityDate) {
      existing.lastActivityDate = inqLast;
    }

    for (const c of inq.caseMatters) {
      existing.caseCount += 1;
      const memo = c.accountingMemo;
      if (memo?.paidAmount) {
        existing.totalRevenue += memo.paidAmount;
      }
      const caseLast = memo?.paidAt ?? c.updatedAt ?? c.createdAt;
      if (caseLast > existing.lastActivityDate) {
        existing.lastActivityDate = caseLast;
      }
    }

    byEmail.set(key, existing);
  }

  return byEmail;
}

function buildLTV(agg: AggregatedCustomer): CustomerLTV {
  const now = Date.now();
  const daysSince = Math.max(
    0,
    Math.floor((now - agg.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const avgCaseValue =
    agg.caseCount > 0 ? agg.totalRevenue / agg.caseCount : 0;
  const churnRisk = predictChurnRisk(daysSince, agg.caseCount);
  const lifetimeMonths = predictedLifetimeMonths(agg.caseCount, churnRisk);
  const factor = engagementFactor(agg.caseCount);
  const predictedLTV = Math.round(avgCaseValue * lifetimeMonths * factor);

  return {
    email: agg.email,
    name: agg.name,
    firstContactDate: agg.firstContactDate,
    totalRevenue: agg.totalRevenue,
    caseCount: agg.caseCount,
    avgCaseValue: Math.round(avgCaseValue),
    predictedLifetimeMonths: lifetimeMonths,
    predictedLTV,
    churnRisk,
    lastActivityDate: agg.lastActivityDate,
  };
}

export async function calculateCustomerLTV(
  email: string,
): Promise<CustomerLTV | null> {
  const aggregated = await aggregateCustomers(email);
  const record = aggregated.get(email.toLowerCase());
  if (!record) return null;
  return buildLTV(record);
}

export async function getTopLTVCustomers(limit = 20): Promise<CustomerLTV[]> {
  const aggregated = await aggregateCustomers();
  const list = Array.from(aggregated.values()).map(buildLTV);
  list.sort((a, b) => b.predictedLTV - a.predictedLTV);
  return list.slice(0, limit);
}
