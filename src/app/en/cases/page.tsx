import type { Metadata } from "next";

import CasesContent, { buildCasesMetadata } from "@/components/public/cases-content";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildCasesMetadata("en");
}

export default function EnCasesPage() {
  return <CasesContent lang="en" />;
}
