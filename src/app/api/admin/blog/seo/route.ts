import { NextResponse } from "next/server";
import { generateBlogSEO } from "@/lib/services/blog-seo-service";

export async function POST(request: Request) {
  try {
    const { title, body, category } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "title과 body는 필수입니다" },
        { status: 400 },
      );
    }

    const seo = await generateBlogSEO(title, body, category ?? "general");
    return NextResponse.json(seo);
  } catch (err) {
    console.error("Blog SEO generation error:", err);
    return NextResponse.json({ error: "SEO 생성 실패" }, { status: 500 });
  }
}
