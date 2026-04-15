import { redirect } from "next/navigation";

import { requireAdminPageSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  await requireAdminPageSession("/admin", "STAFF");
  redirect("/admin/inquiries");
}
