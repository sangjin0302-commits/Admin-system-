import { redirect } from "next/navigation";

import { getOptionalAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getOptionalAdminSession();

  if (!session) {
    redirect("/admin/login?next=%2Fadmin%2Finquiries");
  }

  redirect("/admin/inquiries");
}
