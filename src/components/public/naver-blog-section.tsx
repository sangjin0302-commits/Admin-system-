import { Reveal } from "@/components/public/reveal";
import type { NaverBlogPost } from "@/lib/services/naver-blog";

export function NaverBlogSection({ posts, blogId }: { posts: NaverBlogPost[]; blogId: string }) {
  return (
    <section className="py-20 sm:py-24" aria-labelledby="naver-blog-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="ethos-eyebrow">From Naver Blog</p>
              <h2 id="naver-blog-heading" className="ethos-display mt-3 text-3xl sm:text-[2.4rem]">
                네이버 블로그 최신글
              </h2>
            </div>
            <a
              href={`https://blog.naver.com/${blogId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#03C75A]/40 bg-[#03C75A]/10 px-4 font-serif text-sm font-semibold text-[#03A94C] transition hover:bg-[#03C75A]/20"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#03C75A] text-[11px] font-black text-white">
                N
              </span>
              블로그 전체 보기
            </a>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <Reveal key={p.link} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <a href={p.link} target="_blank" rel="noreferrer" className="group block h-full">
                <article className="ethos-card ethos-blog-card flex h-full flex-col p-7">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#03C75A]/10 px-3 py-1 text-[11px] font-bold text-[#03A94C]">
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-[#03C75A] text-[10px] font-black text-white">
                        N
                      </span>
                      {p.category}
                    </span>
                    {p.date && <span className="text-xs text-text-muted">{p.date}</span>}
                  </div>
                  <h3 className="ethos-display ethos-blog-title mt-5 text-lg leading-snug">{p.title}</h3>
                  {p.excerpt && <p className="mt-3 flex-1 text-sm leading-7 text-text-muted">{p.excerpt}…</p>}
                  <span className="mt-5 inline-flex items-center gap-1 font-serif text-sm font-semibold text-primary group-hover:text-gold-deep">
                    네이버에서 읽기
                    <span className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
                  </span>
                </article>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
