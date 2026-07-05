/**
 * 사무소 지식 그래프 — 사건·의뢰인·판례·법령의 연결을 나타내는 노드/엣지 목록.
 *
 * 노드 타입: case, client, precedent, law, category
 * 엣지 타입:
 *   - case→client (당사자)
 *   - case→category (분류)
 *   - case→precedent (내부메모/요약에서 사건번호 언급)
 *   - case→law (요약에서 "제N조" 언급)
 *   - client↔client (동일 사건 공동 당사자)
 *
 * SiteSetting key "kg.snapshot" 에 24h 캐시.
 */

import { prisma } from "@/lib/prisma/client";
import { listPrecedents } from "@/lib/services/precedent-database-service";
import { logger } from "@/lib/utils/logger";

const CACHE_KEY = "kg.snapshot";
const CACHE_TTL_MS = 24 * 3_600_000;

export type GraphNodeType = "case" | "client" | "precedent" | "law" | "category";

export type GraphNode = {
  id: string;
  type: GraphNodeType;
  label: string;
  meta?: Record<string, string>;
};

export type GraphEdge = {
  source: string;
  target: string;
  kind: "party" | "category" | "precedent" | "law" | "cohort";
  weight?: number;
};

export type KnowledgeGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  builtAt: string;
  stats: {
    cases: number;
    clients: number;
    precedents: number;
    laws: number;
    edges: number;
  };
};

const CASE_NO_REGEX = /(\d{4}[가-힣]+\d{2,6})/g;
const LAW_REGEX = /([가-힣A-Za-z]+법)\s*제\s*(\d+)\s*조/g;

async function readCache(): Promise<KnowledgeGraph | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: CACHE_KEY } });
    if (!row?.value) return null;
    const parsed = JSON.parse(row.value) as KnowledgeGraph & { _at?: number };
    if (parsed._at && Date.now() - parsed._at < CACHE_TTL_MS) return parsed;
    return null;
  } catch {
    return null;
  }
}

async function writeCache(graph: KnowledgeGraph): Promise<void> {
  const value = JSON.stringify({ ...graph, _at: Date.now() });
  await prisma.siteSetting.upsert({
    where: { key: CACHE_KEY },
    create: { key: CACHE_KEY, value },
    update: { value },
  });
}

export async function invalidateGraph(): Promise<void> {
  await prisma.siteSetting.deleteMany({ where: { key: CACHE_KEY } }).catch(() => undefined);
}

/**
 * 그래프 생성. force=true 면 캐시 무시하고 재빌드.
 */
export async function buildGraph(force = false): Promise<KnowledgeGraph> {
  if (!force) {
    const cached = await readCache();
    if (cached) return cached;
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();

  const pushNode = (n: GraphNode) => {
    if (nodeIds.has(n.id)) return;
    nodeIds.add(n.id);
    nodes.push(n);
  };

  try {
    // 1. Cases + Parties
    const cases = await prisma.caseMatter.findMany({
      take: 500,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        caseNo: true,
        category: true,
        summary: true,
        internalMemo: true,
        parties: { select: { id: true, name: true, role: true, email: true, phone: true } },
      },
    });

    const clientKeyMap = new Map<string, string>(); // normalized name → clientNodeId
    const normalize = (s: string) => s.trim().toLowerCase();

    for (const c of cases) {
      const caseNodeId = `case:${c.id}`;
      pushNode({
        id: caseNodeId,
        type: "case",
        label: c.title.slice(0, 40),
        meta: { caseNo: c.caseNo ?? "", category: c.category },
      });

      // category node
      const catId = `category:${c.category}`;
      pushNode({ id: catId, type: "category", label: c.category });
      edges.push({ source: caseNodeId, target: catId, kind: "category" });

      // clients
      const partiesInCase: string[] = [];
      for (const p of c.parties) {
        if (!p.name) continue;
        const key = normalize(p.name);
        let clientNodeId = clientKeyMap.get(key);
        if (!clientNodeId) {
          clientNodeId = `client:${p.id}`;
          clientKeyMap.set(key, clientNodeId);
          pushNode({
            id: clientNodeId,
            type: "client",
            label: p.name.slice(0, 30),
            meta: { role: p.role },
          });
        }
        edges.push({ source: caseNodeId, target: clientNodeId, kind: "party" });
        partiesInCase.push(clientNodeId);
      }
      // cohort edges among co-parties
      for (let i = 0; i < partiesInCase.length; i++) {
        for (let j = i + 1; j < partiesInCase.length; j++) {
          edges.push({
            source: partiesInCase[i],
            target: partiesInCase[j],
            kind: "cohort",
            weight: 0.5,
          });
        }
      }

      // Extract precedent references + law references from summary/memo
      const haystack = `${c.summary ?? ""}\n${c.internalMemo ?? ""}`;
      const seenCaseNos = new Set<string>();
      for (const m of haystack.matchAll(CASE_NO_REGEX)) {
        const caseNoRef = m[1];
        if (seenCaseNos.has(caseNoRef)) continue;
        seenCaseNos.add(caseNoRef);
        // will resolve after precedent load
        edges.push({
          source: caseNodeId,
          target: `precedent-ref:${caseNoRef}`,
          kind: "precedent",
        });
      }
      const seenLaws = new Set<string>();
      for (const m of haystack.matchAll(LAW_REGEX)) {
        const lawKey = `${m[1]}#제${m[2]}조`;
        if (seenLaws.has(lawKey)) continue;
        seenLaws.add(lawKey);
        const lawId = `law:${lawKey}`;
        pushNode({ id: lawId, type: "law", label: `${m[1]} 제${m[2]}조` });
        edges.push({ source: caseNodeId, target: lawId, kind: "law" });
      }
    }

    // 2. Precedents — resolve refs
    const precedents = await listPrecedents();
    const precByCaseNo = new Map<string, string>();
    for (const p of precedents) {
      const nodeId = `precedent:${p.id}`;
      pushNode({
        id: nodeId,
        type: "precedent",
        label: p.caseNo,
        meta: { court: p.court, category: p.category },
      });
      precByCaseNo.set(p.caseNo, nodeId);
    }
    // rewrite unresolved precedent-ref edges → precedent nodes or drop
    for (let i = edges.length - 1; i >= 0; i--) {
      const e = edges[i];
      if (e.target.startsWith("precedent-ref:")) {
        const caseNoRef = e.target.slice("precedent-ref:".length);
        const target = precByCaseNo.get(caseNoRef);
        if (target) {
          e.target = target;
        } else {
          // create ghost precedent node so mention is still visible
          const ghostId = `precedent-mention:${caseNoRef}`;
          pushNode({ id: ghostId, type: "precedent", label: caseNoRef, meta: { ghost: "1" } });
          e.target = ghostId;
        }
      }
    }
  } catch (err) {
    logger.warn("[knowledge-graph] build failed", err);
  }

  const stats = {
    cases: nodes.filter((n) => n.type === "case").length,
    clients: nodes.filter((n) => n.type === "client").length,
    precedents: nodes.filter((n) => n.type === "precedent").length,
    laws: nodes.filter((n) => n.type === "law").length,
    edges: edges.length,
  };

  const graph: KnowledgeGraph = {
    nodes,
    edges,
    builtAt: new Date().toISOString(),
    stats,
  };
  await writeCache(graph).catch(() => undefined);
  return graph;
}
