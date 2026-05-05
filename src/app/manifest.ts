import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "\uD589\uC815\uC0AC \uC9C4\uD589\uC0C1\uD669 \uC870\uD68C",
    short_name: "\uC9C4\uD589\uC0C1\uD669",
    description: "\uC811\uC218\uBC88\uD638\uB85C \uD589\uC815 \uC5C5\uBB34 \uC9C4\uD589\uC0C1\uD669\uC744 \uD655\uC778\uD569\uB2C8\uB2E4.",
    start_url: "/track",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f4c81",
    lang: "ko-KR",
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
    ]
  };
}
