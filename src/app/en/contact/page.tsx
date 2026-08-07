import type { Metadata } from "next";

import ContactContent, { buildContactMetadata } from "@/components/public/contact-content";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildContactMetadata("en");
}

export default function EnContactPage() {
  return <ContactContent lang="en" />;
}
