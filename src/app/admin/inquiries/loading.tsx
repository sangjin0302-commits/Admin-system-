import { LoadingState } from "@/components/ui/state-panel";

export default function AdminInquiriesLoading() {
  return <LoadingState title="문의 목록을 불러오는 중입니다." description="검색 조건과 문의 데이터를 준비하고 있습니다." rows={5} />;
}
