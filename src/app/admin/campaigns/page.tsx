import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { listCampaigns } from "@/lib/services/email-campaign-service";

import { NewCampaignForm } from "./new-campaign-form";

export const dynamic = "force-dynamic";

function statusBadge(status: string): string {
  switch (status) {
    case "sent":
      return "bg-emerald-100 text-emerald-800";
    case "scheduled":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

export default async function CampaignsPage() {
  const campaigns = listCampaigns();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Marketing"
        title="Email Campaigns"
        description="Create and send targeted email campaigns to inquiry segments."
      />

      <NewCampaignForm />

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">All Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No campaigns yet.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="py-2">Name</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Segment</th>
                <th className="py-2">Recipients</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">{c.subject}</td>
                  <td className="py-2">{c.targetSegment}</td>
                  <td className="py-2">{c.recipientCount}</td>
                  <td className="py-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${statusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2 text-text-muted">
                    {c.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
