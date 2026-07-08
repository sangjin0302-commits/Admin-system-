import { redirect } from "next/navigation";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import DashboardContent from "./dashboard-content";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  if (await isFeatureEnabled("admin_home_briefing_default")) {
    redirect("/admin/morning");
  }
  return <DashboardContent />;
}
