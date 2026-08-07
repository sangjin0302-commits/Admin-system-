import type { Metadata } from "next";

import { CorporateServiceRoute } from "@/components/public/service-route-corporate";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Company Formation — ETHOS Administrative Attorney Office",
  description: "Company formation procedures, articles and registration prep, and linking post-formation permits in one flow."
};

export default function EnCorporatePage() {
  return <CorporateServiceRoute lang="en" />;
}
