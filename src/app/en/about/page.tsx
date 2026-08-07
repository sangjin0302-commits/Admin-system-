import type { Metadata } from "next";

import AboutContent, { buildAboutMetadata } from "@/components/public/about-content";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildAboutMetadata("en");
}

export default function EnAboutPage() {
  return <AboutContent lang="en" />;
}
