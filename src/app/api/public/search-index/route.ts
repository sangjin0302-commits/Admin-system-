import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { listBlogPosts } from "@/lib/blog-posts";

export const dynamic = "force-dynamic";
export const revalidate = 600;

type IndexItem = {
  id: string;
  type: "service" | "blog" | "case";
  title: string;
  description: string;
  url: string;
  category?: string;
};

const SERVICES: IndexItem[] = [
  {
    id: "svc-immigration",
    type: "service",
    title: "비자 / 외국인 체류",
    description:
      "체류 자격 변경, 기간 연장, 영주·국적, 강제퇴거 처분 대응 등 출입국 업무",
    url: "/services/immigration",
    category: "VISA_STAY",
  },
  {
    id: "svc-appeal",
    type: "service",
    title: "행정심판",
    description: "처분 통지부터 청구·심리·재결까지 행정심판 절차",
    url: "/services/appeal",
    category: "ADMIN_APPEAL",
  },
  {
    id: "svc-contract",
    type: "service",
    title: "계약서 / 사실조사",
    description: "계약 검토·작성, 분쟁 사실관계 조사, 조사보고서 작성",
    url: "/services/contract",
    category: "CONTRACT_INVESTIGATION",
  },
  {
    id: "svc-license",
    type: "service",
    title: "인허가",
    description: "사업·건축·식품·의료 등 인허가 신청, 보완 대응, 불복 절차",
    url: "/services/license",
    category: "LICENSE_PERMIT",
  },
  {
    id: "svc-corporate",
    type: "service",
    title: "법인 설립",
    description: "법인 설립 절차, 정관·등기 준비, 설립 후 인허가 연계",
    url: "/services/corporate",
    category: "CORP_FORMATION",
  },
];

export async function GET() {
  const items: IndexItem[] = [...SERVICES];

  try {
    const md = await listBlogPosts();
    for (const p of md) {
      items.push({
        id: `blog-${p.slug}`,
        type: "blog",
        title: p.title,
        description: p.excerpt,
        url: `/blog/${p.slug}`,
        category: p.category,
      });
    }
  } catch {
    // ignore
  }

  try {
    const db = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 200,
      select: { slug: true, title: true, excerpt: true, category: true },
    });
    for (const p of db) {
      if (items.find((x) => x.url === `/blog/${p.slug}`)) continue;
      items.push({
        id: `blog-${p.slug}`,
        type: "blog",
        title: p.title,
        description: p.excerpt,
        url: `/blog/${p.slug}`,
        category: p.category,
      });
    }
  } catch {
    // ignore
  }

  try {
    const cases = await prisma.caseStudy.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      take: 100,
      select: { id: true, title: true, summary: true, category: true },
    });
    for (const c of cases) {
      items.push({
        id: `case-${c.id}`,
        type: "case",
        title: c.title,
        description: c.summary,
        url: `/cases/${c.id}`,
        category: c.category,
      });
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ items, generatedAt: new Date().toISOString() });
}
