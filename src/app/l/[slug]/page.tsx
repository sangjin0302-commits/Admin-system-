import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LandingBlocks } from "@/components/public/landing-blocks";
import { getLanding } from "@/lib/services/landing-page-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getLanding(slug);
  if (!landing) return { title: "Not found" };
  return {
    title: landing.title,
    description: landing.title
  };
}

export default async function PublicLandingPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const landing = await getLanding(slug);
  if (!landing) notFound();

  return (
    <div className="overflow-x-clip">
      <LandingBlocks blocks={landing.blocks} slug={landing.slug} />
    </div>
  );
}
