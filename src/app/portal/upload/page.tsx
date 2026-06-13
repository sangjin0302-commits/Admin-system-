import { redirect } from "next/navigation";

import { PortalHeader } from "@/components/layout/portal-header";
import { UploadClient } from "@/components/public/upload-client";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user) redirect("/portal/signin?callbackUrl=/portal/upload");
  const userId = (session.user as { id?: string }).id;
  const client = userId ? await prisma.portalClient.findUnique({ where: { id: userId } }) : null;

  return (
    <div className="min-h-screen bg-canvas">
      <PortalHeader clientName={client?.name} />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="ethos-eyebrow">Upload</p>
        <h1 className="ethos-display mt-3 text-3xl">자료 업로드</h1>
        <p className="mt-2 text-sm text-text-muted">
          사건 진행에 필요한 자료를 안전하게 업로드하세요. PDF / 이미지 / Word / Excel을 지원합니다.
        </p>

        <UploadClient />
      </main>
    </div>
  );
}
