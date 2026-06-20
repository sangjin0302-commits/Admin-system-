"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

function ToolCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold text-text-strong">{title}</h3>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </Card>
  );
}

function ResultBox({ data }: { data: unknown }) {
  if (data == null) return null;
  return (
    <pre className="rounded bg-surface-muted p-2 text-xs whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function LookupTools() {
  const [passportNo, setPassportNo] = useState("");
  const [foreignerResult, setForeignerResult] = useState<unknown>(null);
  const [foreignerLoading, setForeignerLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [lawResult, setLawResult] = useState<unknown>(null);
  const [lawLoading, setLawLoading] = useState(false);

  const [bizNo, setBizNo] = useState("");
  const [companyResult, setCompanyResult] = useState<unknown>(null);
  const [companyLoading, setCompanyLoading] = useState(false);

  async function post(endpoint: string, body: object) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ToolCard title="외국인 체류 조회">
        <input
          className="rounded border border-line px-3 py-2 text-sm"
          placeholder="여권번호"
          value={passportNo}
          onChange={(e) => setPassportNo(e.target.value)}
        />
        <button
          className="rounded bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={foreignerLoading || !passportNo}
          onClick={async () => {
            setForeignerLoading(true);
            try {
              setForeignerResult(
                await post("/api/admin/public-data/foreigner", { passportNo })
              );
            } finally {
              setForeignerLoading(false);
            }
          }}
        >
          {foreignerLoading ? "조회 중..." : "조회"}
        </button>
        <ResultBox data={foreignerResult} />
      </ToolCard>

      <ToolCard title="법령 검색">
        <input
          className="rounded border border-line px-3 py-2 text-sm"
          placeholder="키워드"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button
          className="rounded bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={lawLoading || !keyword}
          onClick={async () => {
            setLawLoading(true);
            try {
              setLawResult(
                await post("/api/admin/public-data/law", { keyword })
              );
            } finally {
              setLawLoading(false);
            }
          }}
        >
          {lawLoading ? "검색 중..." : "검색"}
        </button>
        <ResultBox data={lawResult} />
      </ToolCard>

      <ToolCard title="사업자 정보 조회">
        <input
          className="rounded border border-line px-3 py-2 text-sm"
          placeholder="사업자등록번호"
          value={bizNo}
          onChange={(e) => setBizNo(e.target.value)}
        />
        <button
          className="rounded bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={companyLoading || !bizNo}
          onClick={async () => {
            setCompanyLoading(true);
            try {
              setCompanyResult(
                await post("/api/admin/public-data/company", { bizNo })
              );
            } finally {
              setCompanyLoading(false);
            }
          }}
        >
          {companyLoading ? "조회 중..." : "조회"}
        </button>
        <ResultBox data={companyResult} />
      </ToolCard>
    </div>
  );
}
