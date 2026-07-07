/**
 * 자동 아키텍처 다이어그램 — src/lib/services / src/app 를 스캔하여
 * 서비스 간 import 의존성 그래프를 Mermaid `graph TD` 마크업으로 생성한다.
 *
 * 계층 분류:
 *   - service : src/lib/services/*
 *   - route   : src/app/api/**
 *   - page    : src/app/**\/page.tsx, layout.tsx
 *
 * 파일 규모가 크므로 최대 N개의 노드/엣지만 출력하고, 노드는 short id 로 축약한다.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

export type ArchNodeLayer = "service" | "route" | "page" | "other";

export type ArchNode = {
  id: string;
  layer: ArchNodeLayer;
  label: string;
  file: string;
};

export type ArchEdge = {
  from: string;
  to: string;
};

export type ArchGraph = {
  nodes: ArchNode[];
  edges: ArchEdge[];
  generatedAt: string;
  stats: {
    files: number;
    edges: number;
    truncatedNodes: boolean;
    truncatedEdges: boolean;
  };
};

const SRC_ROOTS = ["src/lib/services", "src/app/api", "src/app"];
const MAX_NODES = 120;
const MAX_EDGES = 300;

function classifyLayer(rel: string): ArchNodeLayer {
  if (rel.startsWith("src/lib/services/")) return "service";
  if (rel.startsWith("src/app/api/")) return "route";
  if (rel.startsWith("src/app/")) return "page";
  return "other";
}

function toNodeId(rel: string): string {
  // 파일명 기반 짧은 id — Mermaid 호환 (alphanumeric + underscore)
  const base = rel
    .replace(/^src\//, "")
    .replace(/\.tsx?$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base.slice(0, 80);
}

function toLabel(rel: string): string {
  const base = path.basename(rel).replace(/\.tsx?$/, "");
  return base;
}

async function walk(dir: string, results: string[] = []): Promise<string[]> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      await walk(full, results);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      // 테스트 파일은 그래프에서 제외
      if (/\.test\.tsx?$/.test(entry.name)) continue;
      results.push(full);
    }
  }
  return results;
}

const IMPORT_REGEX = /import\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;

function resolveImport(spec: string, fromFile: string, projectRoot: string): string | null {
  if (spec.startsWith("@/")) {
    return path.join(projectRoot, "src", spec.slice(2));
  }
  if (spec.startsWith(".")) {
    return path.resolve(path.dirname(fromFile), spec);
  }
  return null;
}

async function findRealFile(base: string): Promise<string | null> {
  const candidates = [
    base + ".ts",
    base + ".tsx",
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  for (const c of candidates) {
    try {
      const stat = await fs.stat(c);
      if (stat.isFile()) return c;
    } catch {
      // continue
    }
  }
  return null;
}

/**
 * 프로젝트 루트를 기준으로 아키텍처 그래프를 생성한다.
 */
export async function buildArchitectureGraph(projectRoot: string = process.cwd()): Promise<ArchGraph> {
  const files: string[] = [];
  for (const root of SRC_ROOTS) {
    const abs = path.join(projectRoot, root);
    await walk(abs, files);
  }

  // 중복 제거
  const uniqueFiles = Array.from(new Set(files));

  const nodes: ArchNode[] = [];
  const nodeIndex = new Map<string, ArchNode>();
  const edges: ArchEdge[] = [];
  const seenEdges = new Set<string>();

  let truncatedNodes = false;
  let truncatedEdges = false;

  for (const file of uniqueFiles) {
    const rel = path.relative(projectRoot, file).replace(/\\/g, "/");
    const id = toNodeId(rel);
    if (!nodeIndex.has(id)) {
      if (nodes.length >= MAX_NODES) {
        truncatedNodes = true;
        continue;
      }
      const node: ArchNode = {
        id,
        layer: classifyLayer(rel),
        label: toLabel(rel),
        file: rel,
      };
      nodes.push(node);
      nodeIndex.set(id, node);
    }
  }

  for (const file of uniqueFiles) {
    const rel = path.relative(projectRoot, file).replace(/\\/g, "/");
    const fromId = toNodeId(rel);
    if (!nodeIndex.has(fromId)) continue;

    let content = "";
    try {
      content = await fs.readFile(file, "utf-8");
    } catch {
      continue;
    }

    const seenInFile = new Set<string>();
    for (const m of content.matchAll(IMPORT_REGEX)) {
      const spec = m[1];
      const resolved = resolveImport(spec, file, projectRoot);
      if (!resolved) continue;
      const real = await findRealFile(resolved);
      if (!real) continue;
      const relTo = path.relative(projectRoot, real).replace(/\\/g, "/");
      const toId = toNodeId(relTo);
      if (!nodeIndex.has(toId)) continue;
      if (fromId === toId) continue;
      const key = `${fromId}->${toId}`;
      if (seenEdges.has(key) || seenInFile.has(key)) continue;
      seenInFile.add(key);
      if (edges.length >= MAX_EDGES) {
        truncatedEdges = true;
        break;
      }
      edges.push({ from: fromId, to: toId });
      seenEdges.add(key);
    }
    if (truncatedEdges) break;
  }

  return {
    nodes,
    edges,
    generatedAt: new Date().toISOString(),
    stats: {
      files: uniqueFiles.length,
      edges: edges.length,
      truncatedNodes,
      truncatedEdges,
    },
  };
}

/**
 * ArchGraph → Mermaid `graph TD` 마크업
 */
export function toMermaid(graph: ArchGraph, moduleFilter?: string): string {
  const filter = moduleFilter?.trim().toLowerCase();
  const visibleNodes = filter
    ? graph.nodes.filter((n) => n.file.toLowerCase().includes(filter))
    : graph.nodes;
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = graph.edges.filter(
    (e) => visibleIds.has(e.from) && visibleIds.has(e.to)
  );

  const lines: string[] = ["graph TD"];

  // 계층별 subgraph
  const layers: ArchNodeLayer[] = ["page", "route", "service", "other"];
  for (const layer of layers) {
    const inLayer = visibleNodes.filter((n) => n.layer === layer);
    if (inLayer.length === 0) continue;
    lines.push(`  subgraph ${layer}["${layer}"]`);
    for (const n of inLayer) {
      const safeLabel = n.label.replace(/["`]/g, "");
      lines.push(`    ${n.id}["${safeLabel}"]`);
    }
    lines.push("  end");
  }

  for (const e of visibleEdges) {
    lines.push(`  ${e.from} --> ${e.to}`);
  }

  lines.push("");
  lines.push(
    `%% generated ${graph.generatedAt} — files=${graph.stats.files} edges=${graph.stats.edges}` +
      `${graph.stats.truncatedNodes ? " (nodes truncated)" : ""}` +
      `${graph.stats.truncatedEdges ? " (edges truncated)" : ""}`
  );

  return lines.join("\n");
}

/**
 * 다이어그램 마크업을 public/docs/architecture.mmd 에 저장.
 */
export async function saveArchitectureDiagram(projectRoot: string = process.cwd()): Promise<{
  path: string;
  bytes: number;
  graph: ArchGraph;
}> {
  const graph = await buildArchitectureGraph(projectRoot);
  const mermaid = toMermaid(graph);
  const outDir = path.join(projectRoot, "public", "docs");
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "architecture.mmd");
  await fs.writeFile(outPath, mermaid, "utf-8");
  return { path: outPath, bytes: mermaid.length, graph };
}

/**
 * 그래프 요약 — 관리자 UI 카드에서 사용.
 */
export function summarizeGraph(graph: ArchGraph): {
  totalNodes: number;
  totalEdges: number;
  byLayer: Record<ArchNodeLayer, number>;
} {
  const byLayer: Record<ArchNodeLayer, number> = {
    service: 0,
    route: 0,
    page: 0,
    other: 0,
  };
  for (const n of graph.nodes) byLayer[n.layer]++;
  return {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    byLayer,
  };
}
