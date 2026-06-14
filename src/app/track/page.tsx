import type { Metadata } from "next";

import { PublicTrackClient } from "@/components/public-track/public-track-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "\uC811\uC218 \uC9C4\uD589\uC0C1\uD669 \uD655\uC778",
  description:
    "\uC811\uC218\uBC88\uD638\uC640 \uD734\uB300\uD3F0 \uB4A4 4\uC790\uB9AC\uB85C \uACE0\uAC1D\uC6A9 \uC9C4\uD589\uC0C1\uD669\uC744 \uD655\uC778\uD569\uB2C8\uB2E4."
};

export default function TrackPage() {
  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
      <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
      <section className="px-4 sm:px-6">
        <PublicTrackClient />
      </section>
    </div>
  );
}
