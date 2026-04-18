import { LoadingState } from "@/components/ui/state-panel";

export default function IntakeLoadingSafe() {
  return (
    <LoadingState
      title="접수 화면을 준비하고 있습니다."
      description="상담 접수 폼을 불러오고 있습니다."
      rows={4}
    />
  );
}
