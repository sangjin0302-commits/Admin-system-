/**
 * Franchise 타입/상수 — 클라이언트/서버 공용.
 * franchise-service.ts 는 prisma 를 import 하므로 클라이언트가 이걸 직접 import 하면
 * webpack 이 node:async_hooks 등을 번들에 포함시켜 빌드 실패.
 */

export type FranchisePlan = "starter" | "pro" | "enterprise";
export type FranchiseStatus = "pending" | "active" | "suspended" | "cancelled";

export interface Franchise {
  id: string;
  orgName: string;
  adminEmail: string;
  contactName?: string;
  plan: FranchisePlan;
  subdomain: string;
  brandColors?: { primary: string; accent?: string };
  brandLogo?: string;
  status: FranchiseStatus;
  monthlyFee: number;
  estimatedCases?: number;
  note?: string;
  activatedAt?: string;
  createdAt: string;
}

export const FRANCHISE_PLANS: Record<
  FranchisePlan,
  { label: string; monthlyFee: number; features: string[] }
> = {
  starter: {
    label: "Starter",
    monthlyFee: 290_000,
    features: ["기본 사건관리", "온라인 예약", "월 100건"],
  },
  pro: {
    label: "Pro",
    monthlyFee: 490_000,
    features: ["+AI 초안", "+Lawbot", "무제한 사건"],
  },
  enterprise: {
    label: "Enterprise",
    monthlyFee: 0,
    features: ["전용 지원", "커스터마이징", "SLA"],
  },
};
