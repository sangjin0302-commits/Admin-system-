import type { Metadata } from "next";

import { AppealServiceRoute } from "@/components/public/service-route-appeal";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Administrative Appeal — ETHOS Administrative Attorney Office",
  description: "From disposition notice through petition, hearing, and decision — we prepare the administrative appeal with you."
};

export default function EnAppealPage() {
  return <AppealServiceRoute lang="en" />;
}
