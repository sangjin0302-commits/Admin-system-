"use client";

import { useEffect, useState } from "react";

type Heading = { id: string; text: string; level: number };

/**
 * 블로그 본문(.prose) 내 h2/h3를 스캔해 목차를 만들고,
 * 스크롤 위치에 따라 현재 섹션을 하이라이트한다 (scroll-spy).
 * 서버 HTML을 건드리지 않고 클라이언트에서 id를 부여한다.
 */
export function BlogToc({ targetSelector = ".prose" }: { targetSelector?: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const root = document.querySelector(targetSelector);
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll("h2, h3")) as HTMLElement[];

    const slugify = (s: string, i: number) =>
      (s
        .trim()
        .toLowerCase()
        .replace(/[^\w가-힣\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 50) || "section") + `-${i}`;

    const collected: Heading[] = nodes.map((node, i) => {
      if (!node.id) node.id = slugify(node.textContent ?? "", i);
      node.style.scrollMarginTop = "96px";
      return { id: node.id, text: node.textContent ?? "", level: node.tagName === "H3" ? 3 : 2 };
    });
    setHeadings(collected);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [targetSelector]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="목차" className="hidden xl:block">
      <div className="sticky top-28">
        <p className="ethos-eyebrow text-[0.65rem]">목차</p>
        <ul className="mt-4 space-y-2 border-l border-gold/20">
          {headings.map((h) => (
            <li key={h.id} style={{ paddingLeft: h.level === 3 ? 20 : 12 }}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`-ml-px block border-l-2 pl-3 text-xs leading-5 transition-colors ${
                  activeId === h.id
                    ? "border-gold font-semibold text-primary"
                    : "border-transparent text-text-muted hover:text-primary"
                }`}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
