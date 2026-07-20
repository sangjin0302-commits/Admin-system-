import Link from "next/link";

import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

async function safeListOrgs() {
  try {
    return await prisma.organization.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        subdomain: true,
        ownerEmail: true,
        plan: true,
        active: true,
        createdAt: true
      }
    });
  } catch (error) {
    logger.error("Failed to list organizations", error);
    return [];
  }
}

export default async function AdminOrgsPage() {
  const enabled = await isFeatureEnabled("multi_org_mode");
  const orgs = await safeListOrgs();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Platform</p>
        <h2 className="mt-2 text-2xl font-semibold text-text-strong">사무소(Org) 관리</h2>
        <p className="mt-2 text-sm text-text-muted">
          멀티 사무소 모드: <span className={enabled ? "text-success" : "text-text-muted"}>{enabled ? "활성" : "비활성 (default org만 사용)"}</span>
        </p>
        <div className="mt-3">
          <Link
            href="/admin/settings"
            className="text-xs text-text-muted underline hover:text-text-strong"
          >
            multi_org_mode 플래그 설정으로 이동
          </Link>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-text-strong">등록된 사무소 ({orgs.length})</h3>
        {orgs.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">등록된 사무소가 없습니다. POST /api/admin/orgs로 생성하세요.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-text-muted">
                  <th className="py-2 pr-3">이름</th>
                  <th className="py-2 pr-3">서브도메인</th>
                  <th className="py-2 pr-3">대표 이메일</th>
                  <th className="py-2 pr-3">플랜</th>
                  <th className="py-2 pr-3">상태</th>
                  <th className="py-2 pr-3">생성일</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id} className="border-b border-line/50">
                    <td className="py-2 pr-3 text-text-strong">{o.name}</td>
                    <td className="py-2 pr-3 text-text-muted">{o.subdomain}</td>
                    <td className="py-2 pr-3 text-text-muted">{o.ownerEmail}</td>
                    <td className="py-2 pr-3 text-text-muted">{o.plan}</td>
                    <td className="py-2 pr-3">
                      <span className={o.active ? "text-success" : "text-text-muted"}>{o.active ? "활성" : "중지"}</span>
                    </td>
                    <td className="py-2 pr-3 text-text-muted">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
