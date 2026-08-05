/**
 * 홈 마케팅 배열 파서 계약 잠금.
 * 실행: npx tsx scripts/tests/home-copy-parsers-check.ts
 *
 * 검증: 유효 입력 → 파싱 배열 / 빈·형식오류 → fallback 동일성 / 필드수·줄수 불일치 → fallback.
 * 또 home.ts HOME_MESSAGES 의 *List 기본값이 실제로 파싱되는지(라운드트립 가능).
 */
import {
  parseStringList,
  parseTitleDescList,
  parsePhilosophyList,
  parseProcessList,
  parsePracticeList,
  type TitleDesc,
  type PhilosophyText,
  type ProcessText,
  type PracticeText
} from "../../src/lib/services/home-copy-parsers";
import { HOME_MESSAGES } from "../../src/lib/i18n/locales/home";

let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else {
    failed++;
    console.error(`  ✕  ${name}`);
  }
}
/** fallback 회귀는 "값 동일성"으로 판정한다(파서는 안전을 위해 fallback 의 복사본을 돌려줌). */
function eq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ─────────── parseStringList ───────────
const sFallback = ["a", "b", "c"];
check("stringList: 유효 → 파싱", JSON.stringify(parseStringList("x\ny", sFallback)) === '["x","y"]');
check("stringList: 공백줄 제거", JSON.stringify(parseStringList("  x  \n\n  y ", sFallback)) === '["x","y"]');
check("stringList: undefined → fallback", eq(parseStringList(undefined, sFallback), sFallback));
check("stringList: 빈문자 → fallback", eq(parseStringList("", sFallback), sFallback));
check("stringList: 공백만 → fallback", eq(parseStringList("   \n  ", sFallback), sFallback));
check("stringList: fallback 원본 불변", (parseStringList("q", sFallback), JSON.stringify(sFallback) === '["a","b","c"]'));

// ─────────── parseTitleDescList (whyCards) ───────────
const tdFallback: TitleDesc[] = [{ title: "T", desc: "D" }];
check(
  "titleDesc: 유효 → 파싱",
  JSON.stringify(parseTitleDescList("Foo :: Bar\nBaz :: Qux", tdFallback)) ===
    '[{"title":"Foo","desc":"Bar"},{"title":"Baz","desc":"Qux"}]'
);
check("titleDesc: 필드수 부족(1) → fallback", eq(parseTitleDescList("Foo", tdFallback), tdFallback));
check("titleDesc: 필드수 초과(3) → fallback", eq(parseTitleDescList("a :: b :: c", tdFallback), tdFallback));
check("titleDesc: 빈 필드 → fallback", eq(parseTitleDescList("a :: ", tdFallback), tdFallback));
check("titleDesc: 빈입력 → fallback", eq(parseTitleDescList("", tdFallback), tdFallback));
check("titleDesc: 한 줄만 깨져도 전체 fallback", eq(parseTitleDescList("Foo :: Bar\nBROKEN", tdFallback), tdFallback));

// ─────────── parsePhilosophyList (인덱스정렬 → 줄수 고정) ───────────
const phFallback: PhilosophyText[] = [
  { title: "A", description: "da", benefit: "ba" },
  { title: "B", description: "db", benefit: "bb" }
];
check(
  "philosophy: 유효(줄수일치) → 파싱",
  JSON.stringify(parsePhilosophyList("t1 :: d1 :: b1\nt2 :: d2 :: b2", phFallback)) ===
    '[{"title":"t1","description":"d1","benefit":"b1"},{"title":"t2","description":"d2","benefit":"b2"}]'
);
check("philosophy: 줄수 부족 → fallback", eq(parsePhilosophyList("t1 :: d1 :: b1", phFallback), phFallback));
check(
  "philosophy: 줄수 초과 → fallback",
  eq(parsePhilosophyList("a :: b :: c\nd :: e :: f\ng :: h :: i", phFallback), phFallback)
);
check("philosophy: 필드수 불일치(2) → fallback", eq(parsePhilosophyList("t1 :: d1\nt2 :: d2 :: b2", phFallback), phFallback));
check("philosophy: 빈 필드 → fallback", eq(parsePhilosophyList("t1 ::  :: b1\nt2 :: d2 :: b2", phFallback), phFallback));
check("philosophy: 빈입력 → fallback", eq(parsePhilosophyList(undefined, phFallback), phFallback));

// ─────────── parseProcessList (자기완결 → 줄수 자유) ───────────
const prFallback: ProcessText[] = [{ step: "01", title: "t", desc: "d" }];
check(
  "process: 유효 → 파싱",
  JSON.stringify(parseProcessList("01 :: 접수 :: 설명\n02 :: 확인 :: 설명2", prFallback)) ===
    '[{"step":"01","title":"접수","desc":"설명"},{"step":"02","title":"확인","desc":"설명2"}]'
);
check("process: 필드수 불일치 → fallback", eq(parseProcessList("01 :: 접수", prFallback), prFallback));
check("process: 빈 필드 → fallback", eq(parseProcessList("01 ::  :: d", prFallback), prFallback));
check("process: 빈입력 → fallback", eq(parseProcessList("", prFallback), prFallback));

// ─────────── parsePracticeList (인덱스정렬 → 줄수 고정, bullets |) ───────────
const paFallback: PracticeText[] = [
  { title: "T1", subtitle: "S1", description: "D1", bullets: ["x"] },
  { title: "T2", subtitle: "S2", description: "D2", bullets: ["y"] }
];
check(
  "practice: 유효 → 파싱(bullets 분리)",
  JSON.stringify(
    parsePracticeList("t1 :: s1 :: d1 :: b1a|b1b\nt2 :: s2 :: d2 :: b2a", paFallback)
  ) ===
    JSON.stringify([
      { title: "t1", subtitle: "s1", description: "d1", bullets: ["b1a", "b1b"] },
      { title: "t2", subtitle: "s2", description: "d2", bullets: ["b2a"] }
    ])
);
check(
  "practice: 줄수 불일치 → fallback",
  eq(parsePracticeList("t1 :: s1 :: d1 :: b1", paFallback), paFallback)
);
check(
  "practice: 필드수 불일치(3) → fallback",
  eq(parsePracticeList("t1 :: s1 :: d1\nt2 :: s2 :: d2 :: b", paFallback), paFallback)
);
check(
  "practice: 빈 bullets → fallback",
  eq(parsePracticeList("t1 :: s1 :: d1 :: \nt2 :: s2 :: d2 :: b", paFallback), paFallback)
);
check(
  "practice: 빈 필드 → fallback",
  eq(parsePracticeList("t1 ::  :: d1 :: b\nt2 :: s2 :: d2 :: b", paFallback), paFallback)
);
check("practice: 빈입력 → fallback", eq(parsePracticeList(undefined, paFallback), paFallback));

// ─────────── HOME_MESSAGES 기본 직렬화본이 파싱되는지(라운드트립 가능) ───────────
// 고유 sentinel fallback 을 넘겨, 결과가 fallback 이 아니면(=기본값이 파싱됨) 통과.
for (const lang of ["ko", "en"] as const) {
  const m = HOME_MESSAGES[lang];
  const sent = ["__SENTINEL__"];
  const bd = parseStringList(m.benefitsList, sent);
  check(`${lang}: benefitsList 기본값 파싱`, bd.length === 3 && bd[0] !== "__SENTINEL__");
  const lb = parseStringList(m.leadBulletsList, sent);
  check(`${lang}: leadBulletsList 기본값 파싱`, lb.length === 4 && lb[0] !== "__SENTINEL__");

  const tdSent: TitleDesc[] = [{ title: "__S__", desc: "__S__" }];
  const wc = parseTitleDescList(m.whyCardsList, tdSent);
  check(`${lang}: whyCardsList 기본값 파싱`, wc.length === 4 && wc[0].title !== "__S__");

  const phSent: PhilosophyText[] = [
    { title: "__S__", description: "", benefit: "" },
    { title: "", description: "", benefit: "" },
    { title: "", description: "", benefit: "" }
  ];
  const ph = parsePhilosophyList(m.philosophyList, phSent);
  check(`${lang}: philosophyList 기본값 파싱(3줄)`, ph.length === 3 && ph[0].title !== "__S__");

  const prSent: ProcessText[] = [{ step: "__S__", title: "", desc: "" }];
  const pr = parseProcessList(m.processList, prSent);
  check(`${lang}: processList 기본값 파싱(5줄)`, pr.length === 5 && pr[0].step === "01");

  const paSent: PracticeText[] = Array.from({ length: 5 }, () => ({
    title: "__S__",
    subtitle: "",
    description: "",
    bullets: ["__S__"]
  }));
  const pa = parsePracticeList(m.practiceList, paSent);
  check(
    `${lang}: practiceList 기본값 파싱(5줄, 각 bullets≥1)`,
    pa.length === 5 && pa[0].title !== "__S__" && pa.every((x) => x.bullets.length >= 1)
  );
}

if (failed > 0) {
  console.error(`\n[home-copy-parsers] FAILED ${failed}건`);
  process.exit(1);
}
console.log("\n[home-copy-parsers] OK — 파서 fallback 안전성 + HOME_MESSAGES 기본값 라운드트립 유지.");
