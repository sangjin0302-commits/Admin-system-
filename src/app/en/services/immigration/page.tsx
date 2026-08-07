import type { Metadata } from "next";

import { ImmigrationServiceRoute } from "@/components/public/service-route-immigration";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Visa / Immigration — ETHOS Administrative Attorney Office",
  description: "Status changes and extensions, business/investment visas, and removal defense — organized in one flow."
};

export default function EnVisaPage() {
  return <ImmigrationServiceRoute lang="en" />;
}
