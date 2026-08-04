import { redirect } from "next/navigation";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import DashboardContent from "./dashboard-content";
import { AdminPendingWork } from "@/components/admin/admin-pending-work";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  if (await isFeatureEnabled("admin_home_briefing_default")) {
    redirect("/admin/morning");
  }
  return (
    <div className="space-y-6">
      <AdminPendingWork />
      <DashboardContent />
    </div>
  );
}
