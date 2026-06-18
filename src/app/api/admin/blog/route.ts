import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt ?? "",
        body: data.body,
        category: data.category ?? "general",
        tags: data.tags ?? "[]",
        published: data.published ?? false,
        publishedAt: data.published ? new Date() : null,
      },
    });
    return NextResponse.json(post);
  } catch (err) {
    console.error("Blog create error:", err);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: "ID 필요" }, { status: 400 });

    const existing = await prisma.blogPost.findUnique({ where: { id: data.id } });
    const post = await prisma.blogPost.update({
      where: { id: data.id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt ?? "",
        body: data.body,
        category: data.category ?? "general",
        tags: data.tags ?? "[]",
        published: data.published ?? false,
        publishedAt: data.published && !existing?.publishedAt ? new Date() : existing?.publishedAt,
      },
    });
    return NextResponse.json(post);
  } catch (err) {
    console.error("Blog update error:", err);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}
