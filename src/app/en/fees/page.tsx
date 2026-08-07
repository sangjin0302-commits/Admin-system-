import type { Metadata } from "next";

import FeesContent, { buildFeesMetadata } from "@/components/public/fees-content";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildFeesMetadata("en");
}

export default function EnFeesPage() {
  return <FeesContent lang="en" />;
}
