import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  PUBLIC_CATEGORY_LABEL,
  PUBLIC_CATEGORY_LABEL_EN,
  INTERNAL_CATEGORY_LABEL,
  INTERNAL_TO_PUBLIC,
  type PublicCategory,
  type InternalCategory,
} from "@/lib/services/blog-categorizer";

export const dynamic = "force-static";
export const metadata = { title: "블로그 카테고리 도움말 — ETHOS Admin" };

const publicKeys = Object.keys(PUBLIC_CATEGORY_LABEL) as PublicCategory[];
const internalKeys = Object.keys(INTERNAL_CATEGORY_LABEL) as InternalCategory[];

export default function BlogCategoriesHelpPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">블로그 카테고리 도움말</h1>
        <p className="text-sm text-gray-600">
          현재 카테고리 목록, 글별 직접 변경 방법, 새 카테고리 추가 과정.
        </p>
      </header>

      {/* ── 현재 카테고리 ─────────────────────────────── */}
      <Card className="p-5 space-y-3">
        <h2 className="text-lg font-semibold">1. 현재 공개 카테고리 (5+1)</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-1">키</th>
              <th className="py-1">한글 라벨</th>
              <th className="py-1">영문 라벨</th>
            </tr>
          </thead>
          <tbody>
            {publicKeys.map((k) => (
              <tr key={k} className="border-t">
                <td className="py-1 font-mono text-xs">{k}</td>
                <td className="py-1">{PUBLIC_CATEGORY_LABEL[k]}</td>
                <td className="py-1 text-gray-600">{PUBLIC_CATEGORY_LABEL_EN[k]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500">
          공개 카테고리는 의뢰인에게 노출됩니다. 자동분류 실패 시 fallback 은 <code>other</code>.
        </p>
      </Card>

      {/* ── 내부 세분류 ───────────────────────────────── */}
      <Card className="p-5 space-y-3">
        <h2 className="text-lg font-semibold">2. 내부 세분류 (admin/통계용)</h2>
        <p className="text-sm text-gray-600">
          admin·통계에서만 쓰는 세분류. 공개 페이지에서는 아래 매핑에 따라 5대 공개
          카테고리로 자동 변환됩니다.
        </p>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-1">키</th>
              <th className="py-1">라벨</th>
              <th className="py-1">→ 공개 매핑</th>
            </tr>
          </thead>
          <tbody>
            {internalKeys.map((k) => (
              <tr key={k} className="border-t">
                <td className="py-1 font-mono text-xs">{k}</td>
                <td className="py-1">{INTERNAL_CATEGORY_LABEL[k]}</td>
                <td className="py-1 text-gray-600">
                  {PUBLIC_CATEGORY_LABEL[INTERNAL_TO_PUBLIC[k]]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── 직접 변경 ────────────────────────────────── */}
      <Card className="p-5 space-y-3">
        <h2 className="text-lg font-semibold">3. 특정 글 카테고리 직접 변경</h2>
        <ol className="list-decimal list-inside text-sm space-y-2 text-gray-700">
          <li>
            <Link href="/admin/blog" className="text-blue-600 underline">
              /admin/blog
            </Link>{" "}
            → 목록에서 글 클릭
          </li>
          <li>편집 화면 상단 &ldquo;카테고리&rdquo; 드롭다운에서 원하는 값 선택</li>
          <li>저장. 저장 즉시 공개 페이지 반영.</li>
        </ol>
        <p className="text-xs text-gray-500">
          자동분류가 잘못 붙었거나, 자동분류에 없는 특수 카테고리로 옮길 때 사용.
          내부 세분류(예 <code>naturalization</code>)도 이 드롭다운에서 선택 가능.
        </p>
      </Card>

      {/* ── 일괄 재분류 ──────────────────────────────── */}
      <Card className="p-5 space-y-3">
        <h2 className="text-lg font-semibold">4. 전체 재분류 (오분류 정비)</h2>
        <p className="text-sm text-gray-600">
          분류기 규칙을 바꿨을 때 또는 이전 수입분이 잘못 분류된 경우 일괄 재계산.
        </p>
        <ol className="list-decimal list-inside text-sm space-y-2 text-gray-700">
          <li>
            SUPER 로그인 상태에서{" "}
            <code>POST /api/admin/blog/maintenance</code> 호출
            <div className="mt-1 ml-6 font-mono text-xs bg-gray-50 p-2 rounded">
              {`{ "task": "reclassify" }              // dry-run 리포트`}<br />
              {`{ "task": "reclassify", "apply": true } // 실제 반영`}
            </div>
          </li>
          <li>
            중복 정리도 같은 엔드포인트:
            <div className="mt-1 ml-6 font-mono text-xs bg-gray-50 p-2 rounded">
              {`{ "task": "dedup" }                    // dry-run`}<br />
              {`{ "task": "dedup", "apply": true }     // 삭제 (비가역)`}
            </div>
          </li>
        </ol>
      </Card>

      {/* ── 새 카테고리 추가 과정 ────────────────────── */}
      <Card className="p-5 space-y-3">
        <h2 className="text-lg font-semibold">5. 새 카테고리 추가 과정 (코드 변경)</h2>
        <p className="text-sm text-gray-600">
          공개 5대 카테고리 추가는 UI 로 못 함. 아래 파일을 편집해 배포.
        </p>
        <div className="text-sm space-y-3">
          <div>
            <p className="font-semibold">파일: <code className="text-xs">src/lib/services/blog-categorizer.ts</code></p>
            <p className="text-xs text-gray-500 mt-1">한 파일 안에서 다음 5곳 수정:</p>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
            <li>
              <code>PublicCategory</code> 유니온에 새 키 추가
              <div className="ml-6 font-mono text-xs bg-gray-50 p-2 rounded mt-1">
                {`export type PublicCategory = "visa" | ... | "labor";`}
              </div>
            </li>
            <li>
              <code>PUBLIC_CATEGORY_LABEL</code> 에 한글 라벨 추가
              <div className="ml-6 font-mono text-xs bg-gray-50 p-2 rounded mt-1">
                {`labor: "노동·산재",`}
              </div>
            </li>
            <li>
              <code>PUBLIC_CATEGORY_LABEL_EN</code> 에 영문 라벨 추가
              <div className="ml-6 font-mono text-xs bg-gray-50 p-2 rounded mt-1">
                {`labor: "Labor & Compensation",`}
              </div>
            </li>
            <li>
              <code>CATEGORY_CHANNEL</code> 에 상담 채널 지정 (naverTalk/kakao/email/telegram)
              <div className="ml-6 font-mono text-xs bg-gray-50 p-2 rounded mt-1">
                {`labor: "email",`}
              </div>
            </li>
            <li>
              <code>KEYWORDS</code> 에 자동분류 정규식 추가
              <div className="ml-6 font-mono text-xs bg-gray-50 p-2 rounded mt-1">
                {`labor: [ /노동위|산재|부당해고|임금체불/, /labor|workers/i ],`}
              </div>
            </li>
          </ol>
          <div className="pt-2 border-t space-y-1 text-sm">
            <p className="font-semibold text-gray-800">배포 후 확인:</p>
            <ul className="list-disc list-inside text-gray-700 ml-2 text-xs space-y-1">
              <li>이 페이지에 새 카테고리 표에 자동 반영 (Server Component).</li>
              <li><code>/admin/blog/[id]</code> 드롭다운에도 자동 노출.</li>
              <li>과거 글에도 적용하려면 위 4번 재분류 실행.</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* ── 크론 스케줄 ──────────────────────────────── */}
      <Card className="p-5 space-y-3">
        <h2 className="text-lg font-semibold">6. 블로그 관련 크론</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-1">크론</th>
              <th className="py-1">KST</th>
              <th className="py-1">역할</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            <tr className="border-t">
              <td className="py-1 font-mono text-xs">content-sync</td>
              <td className="py-1">매일 14:00</td>
              <td className="py-1">네이버 RSS 수입 + AI 번역 + 자동마케팅</td>
            </tr>
            <tr className="border-t">
              <td className="py-1 font-mono text-xs">weekly-batch</td>
              <td className="py-1">월 08:00</td>
              <td className="py-1">뉴스레터 / 주간리포트 / cleanup</td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs text-gray-500">
          네이버 오후 1시 발행 후 14:00 KST 에 수입 → 익일 아침 검색 노출까지 자연스러운
          간격. 전체 크론표는 <code>vercel.json</code>.
        </p>
      </Card>
    </div>
  );
}
