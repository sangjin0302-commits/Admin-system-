import type { Metadata } from "next";

import CareersContent, { buildCareersMetadata } from "@/components/public/careers-content";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildCareersMetadata("en");
}

export default function EnCareersPage() {
  return <CareersContent lang="en" />;
}
