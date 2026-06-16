import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ETHOS 행정사사무소",
    short_name: "ETHOS",
    description:
      "비자/체류, 행정심판, 계약서·사실조사, 인허가. 절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf6ef",
    theme_color: "#1a3c5f",
    lang: "ko-KR",
    categories: ["business", "government", "productivity"],
    icons: [
      {
        src: "/icons/tracking-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icons/tracking-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icons/tracking-maskable.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      { name: "상담 신청", short_name: "상담", url: "/intake" },
      { name: "진행상황 조회", short_name: "조회", url: "/track" },
      { name: "AI 사전 진단", short_name: "AI진단", url: "/quick-check" }
    ]
  };
}
