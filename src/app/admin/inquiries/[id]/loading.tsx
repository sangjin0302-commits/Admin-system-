import { LoadingState } from "@/components/ui/state-panel";

export default function AdminInquiryDetailLoading() {
  return <LoadingState title="문의 상세를 불러오는 중입니다." description="분류 결과와 메시지 미리보기를 준비하고 있습니다." rows={4} />;
}
