import type { Metadata } from "next";

import { LicenseServiceRoute } from "@/components/public/service-route-license";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Licenses & Permits — ETHOS Administrative Attorney Office",
  description: "Business, construction, food, and medical permit applications, supplementary responses, and appeals."
};

export default function EnLicensePage() {
  return <LicenseServiceRoute lang="en" />;
}
