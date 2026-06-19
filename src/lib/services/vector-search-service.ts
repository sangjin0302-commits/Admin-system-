export type VectorDoc = {
  id: string;
  content: string;
  metadata: Record<string, string>;
  embedding?: number[];
};

export type SearchResult = {
  id: string;
  content: string;
  metadata: Record<string, string>;
  score: number;
};

const store = new Map<string, VectorDoc>();

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

const VOCAB_DIM = 256;

function hashToken(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % VOCAB_DIM;
}

function keywordVector(text: string): number[] {
  const tokens = tokenize(text);
  const vec = new Array(VOCAB_DIM).fill(0);
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  for (const [token, count] of freq) {
    const idx = hashToken(token);
    const tf = count / tokens.length;
    const idfApprox = Math.log(1 + 1 / (token.length || 1));
    vec[idx] += tf * (1 + idfApprox);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (norm > 0) for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  return vec;
}

async function openAiEmbed(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: { embedding: number[] }[] };
    return json.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export async function addDocument(doc: VectorDoc): Promise<void> {
  let embedding = doc.embedding;
  if (!embedding || embedding.length === 0) {
    const openai = await openAiEmbed(doc.content);
    embedding = openai ?? keywordVector(doc.content);
  }
  store.set(doc.id, { ...doc, embedding });
}

export async function searchSimilar(query: string, limit = 5): Promise<SearchResult[]> {
  if (store.size === 0) return [];
  const openai = await openAiEmbed(query);
  const queryVec = openai ?? keywordVector(query);
  const results: SearchResult[] = [];
  for (const doc of store.values()) {
    if (!doc.embedding) continue;
    const score = cosineSimilarity(queryVec, doc.embedding);
    results.push({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
      score,
    });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export function removeDocument(id: string): void {
  store.delete(id);
}

export function getStats(): { docCount: number; avgEmbeddingDim: number } {
  const docs = Array.from(store.values());
  if (docs.length === 0) return { docCount: 0, avgEmbeddingDim: 0 };
  const totalDim = docs.reduce((s, d) => s + (d.embedding?.length ?? 0), 0);
  return {
    docCount: docs.length,
    avgEmbeddingDim: Math.round(totalDim / docs.length),
  };
}
