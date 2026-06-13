import { redirect } from "next/navigation";

import { UploadClient } from "@/components/public/upload-client";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user) redirect("/portal/signin?callbackUrl=/portal/upload");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Upload</p>
      <h1 className="mt-3 font-serif text-3xl font-bold text-primary">자료 업로드</h1>
      <p className="mt-2 text-sm text-text-muted">
        사건 진행에 필요한 자료를 안전하게 업로드하세요. PDF / 이미지 / Word / Excel을 지원합니다.
      </p>

      <UploadClient />
    </div>
  );
}
