import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ExcelUpload } from "@/components/admin/excel-upload";

export default function BulkUploadPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Data Import"
        title="일괄 등록"
        description="CSV 파일로 문의 데이터를 일괄 등록합니다. 헤더 행에 이름, 이메일, 전화, 유형, 내용 컬럼을 포함해주세요."
      />

      <ExcelUpload
        endpoint="/api/admin/bulk-upload"
        label="문의 일괄 등록 (CSV)"
      />

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text-strong">CSV 형식 안내</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-text-muted">컬럼명</th>
                <th className="px-3 py-2 text-left font-semibold text-text-muted">필수</th>
                <th className="px-3 py-2 text-left font-semibold text-text-muted">설명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr><td className="px-3 py-2 font-mono">이름</td><td className="px-3 py-2">필수</td><td className="px-3 py-2 text-text-muted">고객 성명</td></tr>
              <tr><td className="px-3 py-2 font-mono">이메일</td><td className="px-3 py-2">필수</td><td className="px-3 py-2 text-text-muted">연락용 이메일</td></tr>
              <tr><td className="px-3 py-2 font-mono">전화</td><td className="px-3 py-2">필수</td><td className="px-3 py-2 text-text-muted">전화번호</td></tr>
              <tr><td className="px-3 py-2 font-mono">유형</td><td className="px-3 py-2">선택</td><td className="px-3 py-2 text-text-muted">VISA_STAY, ADMIN_APPEAL, CONTRACT, LICENSE, GENERAL</td></tr>
              <tr><td className="px-3 py-2 font-mono">내용</td><td className="px-3 py-2">선택</td><td className="px-3 py-2 text-text-muted">문의 내용</td></tr>
              <tr><td className="px-3 py-2 font-mono">분야</td><td className="px-3 py-2">선택</td><td className="px-3 py-2 text-text-muted">서비스 카테고리</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
