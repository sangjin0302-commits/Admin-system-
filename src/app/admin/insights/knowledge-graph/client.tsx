"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphNode, KnowledgeGraph } from "@/lib/services/knowledge-graph-service";

const COLORS: Record<GraphNode["type"], string> = {
  case: "#2563eb",
  client: "#16a34a",
  precedent: "#dc2626",
  law: "#d97706",
  category: "#7c3aed",
};

type Positioned = GraphNode & { x: number; y: number; vx: number; vy: number };

const WIDTH = 900;
const HEIGHT = 600;

export function KnowledgeGraphClient() {
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const rafRef = useRef<number | null>(null);
  const nodesRef = useRef<Positioned[]>([]);

  async function load(force = false) {
    setLoading(true);
    setError("");
    try {
      const res = force
        ? await fetch("/api/admin/insights/knowledge-graph", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "rebuild" }),
          })
        : await fetch("/api/admin/insights/knowledge-graph");
      const j = await res.json();
      if (!j.ok) {
        setError(j.error ?? "불러오기 실패");
      } else {
        setGraph(j.graph);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Filtered subgraph
  const view = useMemo(() => {
    if (!graph) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] };
    const needle = filter.trim().toLowerCase();
    const nodes = graph.nodes.filter((n) =>
      needle ? n.label.toLowerCase().includes(needle) || n.id.toLowerCase().includes(needle) : true
    );
    const ids = new Set(nodes.map((n) => n.id));
    const edges = graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
    return { nodes, edges };
  }, [graph, filter]);

  // Simple force-directed simulation (client-side)
  useEffect(() => {
    if (view.nodes.length === 0) return;
    const positioned: Positioned[] = view.nodes.map((n, i) => ({
      ...n,
      x: WIDTH / 2 + Math.cos((i / view.nodes.length) * 2 * Math.PI) * 200 + (Math.random() - 0.5) * 50,
      y: HEIGHT / 2 + Math.sin((i / view.nodes.length) * 2 * Math.PI) * 200 + (Math.random() - 0.5) * 50,
      vx: 0,
      vy: 0,
    }));
    nodesRef.current = positioned;
    const idIndex = new Map(positioned.map((n, i) => [n.id, i]));
    const edges = view.edges
      .map((e) => ({ a: idIndex.get(e.source), b: idIndex.get(e.target) }))
      .filter((e): e is { a: number; b: number } => e.a !== undefined && e.b !== undefined);

    let iter = 0;
    const maxIter = 250;
    const step = () => {
      const nodes = nodesRef.current;
      const k = 45;
      // repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist2 = dx * dx + dy * dy + 0.01;
          const f = (k * k) / dist2;
          const fx = dx * f;
          const fy = dy * f;
          nodes[i].vx -= fx * 0.1;
          nodes[i].vy -= fy * 0.1;
          nodes[j].vx += fx * 0.1;
          nodes[j].vy += fy * 0.1;
        }
      }
      // attraction (springs)
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const f = (dist * dist) / (k * 8);
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        a.vx += fx * 0.1;
        a.vy += fy * 0.1;
        b.vx -= fx * 0.1;
        b.vy -= fy * 0.1;
      }
      // integrate
      for (const n of nodes) {
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += Math.max(-10, Math.min(10, n.vx));
        n.y += Math.max(-10, Math.min(10, n.vy));
        n.x = Math.max(20, Math.min(WIDTH - 20, n.x));
        n.y = Math.max(20, Math.min(HEIGHT - 20, n.y));
      }
      iter++;
      if (iter % 5 === 0 || iter === maxIter) {
        const snap: Record<string, { x: number; y: number }> = {};
        for (const n of nodes) snap[n.id] = { x: n.x, y: n.y };
        setPositions(snap);
      }
      if (iter < maxIter) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [view.nodes.length, view.edges.length]);

  const highlighted = useMemo(() => {
    if (!selectedId) return null;
    const neighbors = new Set<string>([selectedId]);
    for (const e of view.edges) {
      if (e.source === selectedId) neighbors.add(e.target);
      if (e.target === selectedId) neighbors.add(e.source);
    }
    return neighbors;
  }, [selectedId, view.edges]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="노드 필터 (라벨 검색)"
          className="h-10 flex-1 min-w-[200px] rounded-lg border border-line px-3 text-sm"
        />
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading}
          className="h-10 rounded-lg border border-line px-4 text-sm font-semibold"
        >
          그래프 재빌드
        </button>
        {graph && (
          <span className="text-xs text-text-muted">
            사건 {graph.stats.cases} · 의뢰인 {graph.stats.clients} · 판례 {graph.stats.precedents} · 법령 {graph.stats.laws} · 연결 {graph.stats.edges}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.entries(COLORS) as Array<[GraphNode["type"], string]>).map(([type, color]) => (
          <span key={type} className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
            {type}
          </span>
        ))}
      </div>

      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-text-muted">그래프 계산 중...</p>}

      {view.nodes.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ maxHeight: 600 }}>
            {view.edges.map((e, i) => {
              const a = positions[e.source];
              const b = positions[e.target];
              if (!a || !b) return null;
              const dim = highlighted && !(highlighted.has(e.source) && highlighted.has(e.target));
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={dim ? "#e5e7eb" : "#94a3b8"}
                  strokeWidth={e.kind === "cohort" ? 0.5 : 1}
                  opacity={dim ? 0.3 : 0.7}
                />
              );
            })}
            {view.nodes.map((n) => {
              const pos = positions[n.id];
              if (!pos) return null;
              const dim = highlighted && !highlighted.has(n.id);
              const isSelected = selectedId === n.id;
              return (
                <g
                  key={n.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedId(isSelected ? null : n.id)}
                  style={{ cursor: "pointer", opacity: dim ? 0.3 : 1 }}
                >
                  <circle
                    r={isSelected ? 8 : 5}
                    fill={COLORS[n.type]}
                    stroke={isSelected ? "#000" : "#fff"}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text x={8} y={4} fontSize={9} fill="#111">
                    {n.label.slice(0, 20)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {selectedId && graph && (
        <div className="rounded-lg border border-line bg-surface-muted p-4">
          <p className="text-xs text-text-muted">선택된 노드</p>
          <p className="mt-1 font-semibold">
            {graph.nodes.find((n) => n.id === selectedId)?.label} ({graph.nodes.find((n) => n.id === selectedId)?.type})
          </p>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="mt-2 text-xs text-primary underline"
          >
            선택 해제
          </button>
        </div>
      )}
    </div>
  );
}
