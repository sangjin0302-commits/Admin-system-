import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { detectContentGaps, listRecentLogs } from "@/lib/services/rag-chatbot-service";

export const dynamic = "force-dynamic";

export default async function RagMonitorPage() {
  const enabled = await isFeatureEnabled("rag_chatbot");
  const logs = enabled ? await listRecentLogs(100) : [];
  const gaps = enabled ? await detectContentGaps() : [];
  const up = logs.filter((l) => l.feedback === "up").length;
  const down = logs.filter((l) => l.feedback === "down").length;

  return (
    <section className="space-y-6 rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <div>
        <p className="ui-kicker">Ops</p>
        <h2 className="mt-2 text-xl font-semibold text-text-strong">RAG 챗봇 모니터</h2>
        <p className="mt-2 text-sm text-text-muted">최근 질문·답변·피드백·콘텐츠 갭</p>
      </div>

      {!enabled ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          rag_chatbot 기능이 비활성화되어 있습니다.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-line p-4">
              <p className="text-xs text-text-muted">최근 질문</p>
              <p className="mt-1 text-2xl font-bold">{logs.length}</p>
            </div>
            <div className="rounded-lg border border-line p-4">
              <p className="text-xs text-text-muted">👍</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{up}</p>
            </div>
            <div className="rounded-lg border border-line p-4">
              <p className="text-xs text-text-muted">👎</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{down}</p>
            </div>
          </div>

          {gaps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text-strong">콘텐츠 갭 (답변 품질 낮음 · 자주 물음)</h3>
              <ul className="mt-2 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
                {gaps.slice(0, 10).map((g, i) => (
                  <li key={i}>
                    <span className="font-semibold">×{g.count}</span> {g.question}
                    <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-[10px]">{g.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-text-strong">최근 대화</h3>
            <ul className="mt-2 space-y-2">
              {logs.slice(0, 30).map((l) => (
                <li key={l.id} className="rounded-lg border border-line p-3 text-xs">
                  <p className="text-text-muted">
                    {new Date(l.createdAt).toLocaleString("ko-KR")} · 확신도 {l.confidence} · 출처 {l.sources.length}
                    {l.feedback === "up" && <span className="ml-2 text-emerald-600">👍</span>}
                    {l.feedback === "down" && <span className="ml-2 text-red-600">👎</span>}
                  </p>
                  <p className="mt-1 font-semibold">Q: {l.question}</p>
                  <p className="mt-1 whitespace-pre-wrap text-text-muted">A: {l.answer.slice(0, 300)}{l.answer.length > 300 ? "…" : ""}</p>
                </li>
              ))}
              {logs.length === 0 && (
                <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-text-muted">
                  아직 질문이 없습니다.
                </p>
              )}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
