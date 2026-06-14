import { redirect } from "next/navigation";

// 비용표는 공개하지 않습니다 (운영 페이지 /admin/fees 에서 내부 관리).
// 기존 /fees 접근은 상담 안내(/contact)로 유도합니다.
export default function FeesPage() {
  redirect("/contact");
}
