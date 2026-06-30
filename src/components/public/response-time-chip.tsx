/**
 * 검토 응답 시간 chip — firstResponseAt 기반 실 데이터.
 */
import { prisma } from "@/lib/prisma/client";

async function getAvgResponseLabel(): Promise<string> {
  try {
    const responded = await prisma.inquiry.findMany({
      where: {
        firstResponseAt: { not: null }
      },
      select: { createdAt: true, firstResponseAt: true },
      take: 50,
      orderBy: { createdAt: "desc" }
    });
    if (responded.length < 3) return "영업일 24시간 내";

    const totalMs = responded.reduce(
      (s, i) => s + ((i.firstResponseAt as Date).getTime() - i.createdAt.getTime()),
      0
    );
    const avgH = Math.round(totalMs / responded.length / (1000 * 60 * 60));
    if (avgH < 1) return "평균 1시간 내";
    if (avgH <= 24) return `평균 ${avgH}시간 내`;
    return "영업일 24시간 내";
  } catch {
    return "영업일 24시간 내";
  }
}

export async function ResponseTimeChip() {
  const label = await getAvgResponseLabel();
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {label} 검토 회신
    </span>
  );
}
