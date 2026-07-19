import Link from "next/link";

import { Card } from "@/components/ui/card";

export function PageHeader() {
  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">관리자 전용 문서 실험실</p>
            <h2 className="mt-2 ui-page-title">문서 실험실</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              HWP/HWPX 공공서식 자동완성 파이프라인을 검증하기 위한 관리자 전용 실험 공간입니다.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
          >
            관리자 대시보드
          </Link>
        </div>
      </Card>

      <Card className="border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-900">현재는 읽기 전용 목록 단계입니다.</p>
        <p className="mt-2 text-sm text-amber-900">
          문서 생성 없음, 다운로드 없음, 파일 업로드 없음, CaseMatter 연결 없음, 고객 발송 없음, 기관 제출 없음, AI 단독
          법률판단 없음. 공식 서식 최신성 확인 필요.
        </p>
      </Card>
    </>
  );
}
