"use client";

import { useMemo, useState } from "react";

type MatterType = {
  key: string;
  label: string;
  base: number;
  note?: string;
};

type AddOn = {
  key: string;
  label: string;
  price: number;
};

const MATTER_TYPES: MatterType[] = [
  { key: "admin_appeal", label: "행정심판", base: 3_300_000, note: "일반 처분 취소" },
  { key: "admin_lawsuit", label: "행정소송 대리", base: 4_400_000, note: "1심 기준" },
  { key: "license_permit", label: "인허가 신청", base: 2_200_000, note: "일반 인허가" },
  { key: "license_permit_complex", label: "인허가 (복합)", base: 3_850_000, note: "환경/건축 등" },
  { key: "objection", label: "이의신청", base: 1_650_000 },
  { key: "contract_review", label: "계약서 검토", base: 550_000, note: "1건" },
  { key: "fact_investigation", label: "사실조사", base: 2_200_000 },
  { key: "consult_only", label: "자문 (월정액)", base: 1_100_000, note: "월 4시간" },
];

const ADD_ONS: AddOn[] = [
  { key: "urgency", label: "긴급 처리 (48h)", price: 550_000 },
  { key: "on_site", label: "현장 출장", price: 330_000 },
  { key: "additional_hearing", label: "추가 심리 대응", price: 770_000 },
  { key: "translation", label: "번역/공증", price: 220_000 },
  { key: "expert_opinion", label: "전문가 감정서", price: 1_100_000 },
];

const DISCOUNT_OPTIONS = [
  { key: "none", label: "없음", pct: 0 },
  { key: "referral", label: "지인 소개 (5%)", pct: 5 },
  { key: "repeat", label: "재의뢰 (10%)", pct: 10 },
  { key: "package", label: "패키지 (15%)", pct: 15 },
];

const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

export default function QuoteCalcClient() {
  const [matterKey, setMatterKey] = useState(MATTER_TYPES[0].key);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [discountKey, setDiscountKey] = useState("none");
  const [copied, setCopied] = useState(false);

  const matter = MATTER_TYPES.find((m) => m.key === matterKey) ?? MATTER_TYPES[0];
  const addOnSum = useMemo(
    () => ADD_ONS.filter((a) => selectedAddOns.has(a.key)).reduce((s, a) => s + a.price, 0),
    [selectedAddOns],
  );
  const discountPct = DISCOUNT_OPTIONS.find((d) => d.key === discountKey)?.pct ?? 0;
  const subtotal = matter.base + addOnSum;
  const discountAmount = Math.round((subtotal * discountPct) / 100);
  const total = subtotal - discountAmount;
  const vat = Math.round(total * 0.1);
  const grandTotal = total + vat;

  const toggleAddOn = (k: string) => {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const summary = useMemo(() => {
    const lines = [
      `견적 안내`,
      ``,
      `사건 유형: ${matter.label} (${fmt(matter.base)}원)`,
    ];
    const chosen = ADD_ONS.filter((a) => selectedAddOns.has(a.key));
    if (chosen.length) {
      lines.push(`추가 옵션:`);
      chosen.forEach((a) => lines.push(`  - ${a.label}: ${fmt(a.price)}원`));
    }
    lines.push(``, `소계: ${fmt(subtotal)}원`);
    if (discountAmount > 0) lines.push(`할인 (${discountPct}%): -${fmt(discountAmount)}원`);
    lines.push(`부가세 (10%): ${fmt(vat)}원`);
    lines.push(`합계: ${fmt(grandTotal)}원`);
    return lines.join("\n");
  }, [matter, selectedAddOns, discountPct, subtotal, discountAmount, vat, grandTotal]);

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">사건 유형</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={matterKey}
            onChange={(e) => setMatterKey(e.target.value)}
          >
            {MATTER_TYPES.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label} — {fmt(m.base)}원 {m.note ? `(${m.note})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">추가 옵션</label>
          <div className="space-y-2">
            {ADD_ONS.map((a) => (
              <label
                key={a.key}
                className="flex items-center justify-between border rounded px-3 py-2 cursor-pointer hover:bg-neutral-50"
              >
                <span className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedAddOns.has(a.key)}
                    onChange={() => toggleAddOn(a.key)}
                  />
                  {a.label}
                </span>
                <span className="text-sm text-neutral-600">+{fmt(a.price)}원</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">할인</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={discountKey}
            onChange={(e) => setDiscountKey(e.target.value)}
          >
            {DISCOUNT_OPTIONS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded p-5 bg-neutral-50 h-fit sticky top-4">
        <h2 className="text-lg font-bold mb-4">견적 요약</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-600">기본금</dt>
            <dd className="font-medium">{fmt(matter.base)}원</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">추가 옵션 ({selectedAddOns.size}개)</dt>
            <dd className="font-medium">{fmt(addOnSum)}원</dd>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <dt className="text-neutral-600">소계</dt>
            <dd className="font-medium">{fmt(subtotal)}원</dd>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <dt>할인 ({discountPct}%)</dt>
              <dd>-{fmt(discountAmount)}원</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-neutral-600">부가세 (10%)</dt>
            <dd className="font-medium">{fmt(vat)}원</dd>
          </div>
          <div className="flex justify-between pt-3 border-t-2 border-black text-lg">
            <dt className="font-bold">합계</dt>
            <dd className="font-bold">{fmt(grandTotal)}원</dd>
          </div>
        </dl>

        <button
          onClick={copySummary}
          className="w-full mt-5 bg-black text-white rounded px-4 py-2 text-sm hover:bg-neutral-800"
        >
          {copied ? "복사됨 ✓" : "견적 문안 복사 (카톡/이메일용)"}
        </button>
      </div>
    </div>
  );
}
