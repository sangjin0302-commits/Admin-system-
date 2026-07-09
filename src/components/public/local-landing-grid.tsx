"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SEOUL = [
  { slug: "gangnam", name: "강남구" },
  { slug: "seocho", name: "서초구" },
  { slug: "songpa", name: "송파구" },
  { slug: "gangdong", name: "강동구" },
  { slug: "gwangjin", name: "광진구" },
  { slug: "seongdong", name: "성동구" },
  { slug: "dongdaemun", name: "동대문구" },
  { slug: "jungnang", name: "중랑구" },
  { slug: "nowon", name: "노원구" },
  { slug: "dobong", name: "도봉구" },
  { slug: "gangbuk", name: "강북구" },
  { slug: "seongbuk", name: "성북구" },
  { slug: "jongno", name: "종로구" },
  { slug: "junggu", name: "중구" },
  { slug: "yongsan", name: "용산구" },
  { slug: "mapo", name: "마포구" },
  { slug: "seodaemun", name: "서대문구" },
  { slug: "eunpyeong", name: "은평구" },
  { slug: "yangcheon", name: "양천구" },
  { slug: "gangseo", name: "강서구" },
  { slug: "guro", name: "구로구" },
  { slug: "geumcheon", name: "금천구" },
  { slug: "yeongdeungpo", name: "영등포구" },
  { slug: "dongjak", name: "동작구" },
  { slug: "gwanak", name: "관악구" },
];

const METRO = [
  { slug: "suwon", name: "수원시" },
  { slug: "yongin", name: "용인시" },
  { slug: "seongnam", name: "성남시" },
  { slug: "goyang", name: "고양시" },
  { slug: "bucheon", name: "부천시" },
  { slug: "incheon", name: "인천" },
];

export function LocalLandingGrid() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/public/features")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.flags?.local_landing_nav) setEnabled(true);
      })
      .catch(() => {});
  }, []);

  if (!enabled) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-primary dark:text-white sm:text-3xl">
          지역별 행정사 서비스
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          가까운 지역의 행정사 서비스를 확인하세요
        </p>

        <div className="mt-8 space-y-8">
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold">서울</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
              {SEOUL.map((r) => (
                <Link
                  key={r.slug}
                  href={`/local/${r.slug}`}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-center text-sm font-medium transition-colors hover:border-gold/60 hover:bg-gold/5"
                >
                  {r.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold">수도권</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {METRO.map((r) => (
                <Link
                  key={r.slug}
                  href={`/local/${r.slug}`}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-center text-sm font-medium transition-colors hover:border-gold/60 hover:bg-gold/5"
                >
                  {r.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
