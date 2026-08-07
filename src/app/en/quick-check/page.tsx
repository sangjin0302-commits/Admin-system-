import type { Metadata } from "next";

import QuickCheckContent from "@/components/public/quick-check-content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI Pre-Check — ETHOS Administrative Attorney Office",
  description:
    "Enter your matter and the lawbot AI gives you an advance read on administrative-attorney scope, points to confirm, and risk signals. Get your bearings quickly before requesting a consultation."
};

export default function EnQuickCheckPage() {
  return <QuickCheckContent lang="en" />;
}
