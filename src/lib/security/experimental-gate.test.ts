/**
 * 실험 페이지 게이트 안전성 계약 테스트.
 *
 * 이 게이트는 잘못 걸리면 정상 메뉴가 통째로 막히는 종류의 기능이다.
 * 특히 lab-disabled 는 미들웨어 rewrite 의 목적지라, 여기가 차단되면
 * 무한 리라이트 루프가 된다. 아래를 코드로 못 박는다.
 *
 *   1. 사이드바 메뉴(NAV_GROUPS)의 어떤 항목도 차단되지 않을 것
 *   2. rewrite 목적지(/admin/lab-disabled)는 절대 차단되지 않을 것
 *   3. 의도적으로 남겨둔 실무 화면(통합·재무·기한·사용자·CMS)이 차단되지 않을 것
 *   4. 명백한 실험 화면은 실제로 차단될 것
 */
import { isExperimentalAdminPath, EXPERIMENTAL_ADMIN_PAGES } from "@/lib/security/experimental-admin-pages";
import { NAV_GROUPS } from "@/components/admin/admin-nav-config";

let bad = 0;
for (const g of NAV_GROUPS) {
  for (const it of g.items) {
    if (isExperimentalAdminPath(it.href)) {
      console.error(`❌ nav 메뉴가 차단됨: ${it.href} (${g.title}/${it.label})`);
      bad++;
    }
  }
}
// rewrite 대상은 절대 차단되면 안 된다(무한 루프)
if (isExperimentalAdminPath("/admin/lab-disabled")) { console.error("❌ lab-disabled 가 차단됨 — 무한 루프"); bad++; }
// 유지하기로 한 대표 경로들
for (const keep of ["/admin/integrations/gov24","/admin/finance","/admin/deadline-calculator","/admin/users","/admin/features","/admin/setup","/admin/marketing/seo-audit","/admin/marketing/utm","/admin/landing-gaps","/admin/mentor/case-simulator","/admin/document-lab","/admin/market"]) {
  if (isExperimentalAdminPath(keep)) { console.error(`❌ 유지 대상이 차단됨: ${keep}`); bad++; }
}
// 차단돼야 하는 대표 경로
for (const block of ["/admin/chaos","/admin/insights/journey","/admin/marketing/youtube","/admin/sso","/admin/ar-card"]) {
  if (!isExperimentalAdminPath(block)) { console.error(`❌ 차단돼야 하는데 통과: ${block}`); bad++; }
}
console.log(bad === 0 ? `✅ 게이트 안전 (총 ${EXPERIMENTAL_ADMIN_PAGES.size}개 차단)` : `실패 ${bad}건`);
process.exit(bad === 0 ? 0 : 1);
