import { redirect } from "next/navigation";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReceivablesPage() {
  if (!(await isFeatureEnabled("receivable_alert"))) notFound();
  redirect("/admin/insights/payment-risk");
}
