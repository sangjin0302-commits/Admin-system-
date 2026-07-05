"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Region } from "@/lib/services/international-site-service";

const REGIONS: Array<{ code: Region; label: string; path: string }> = [
  { code: "kr", label: "한국", path: "/" },
  { code: "jp", label: "日本", path: "/jp" },
  { code: "vn", label: "Việt Nam", path: "/vn" },
];

export function RegionSwitcher({ enabled }: { enabled: Region[] }) {
  const path = usePathname() ?? "/";
  const current: Region = path.startsWith("/jp") ? "jp" : path.startsWith("/vn") ? "vn" : "kr";
  return (
    <div className="flex items-center gap-1 text-xs">
      {REGIONS.filter((r) => enabled.includes(r.code)).map((r) => (
        <Link
          key={r.code}
          href={r.path}
          className={`rounded px-2 py-1 ${current === r.code ? "bg-primary text-white" : "text-text-muted"}`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
