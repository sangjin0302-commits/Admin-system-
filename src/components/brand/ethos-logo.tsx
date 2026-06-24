import Image from "next/image";

import { prisma } from "@/lib/prisma/client";

type Props = {
  size?: number;
  className?: string;
};

async function getLogoUrl(): Promise<string> {
  const row = await prisma.siteSetting.findUnique({ where: { key: "image.logo" } }).catch(() => null);
  return row?.value || "/logo.png";
}

export async function EthosLogo({ size = 64, className }: Props) {
  const src = await getLogoUrl();
  return (
    <Image
      src={src}
      alt="ETHOS 행정사사무소 로고"
      width={size}
      height={size}
      className={className}
      unoptimized={src.startsWith("http")}
      priority
    />
  );
}

export function EthosWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <h1 className="font-serif text-4xl font-bold tracking-[0.25em] text-primary sm:text-5xl">
        ETHOS
      </h1>
      <p className="mt-1 font-serif text-sm font-semibold tracking-wide text-text-strong sm:text-base">
        Administrative Attorney Office
      </p>
      <p className="mt-2 font-serif text-xs italic text-gold-deep sm:text-sm">
        Reason in Process · Empathy for People · Trust in Every Step
      </p>
    </div>
  );
}
