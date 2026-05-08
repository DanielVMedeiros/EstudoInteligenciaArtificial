import type { QueryRequest, QueryResponse, IngestResult, ChunkResult, IndexResult } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : "Erro na API");
  }
  return res.json() as Promise<T>;
}

export async function uploadCsv(file: File): Promise<IngestResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/pipelines/ingest-csv`, { method: "POST", body: formData });
  return handle(res);
}

export async function chunkRecipes(): Promise<ChunkResult> {
  const res = await fetch(`${API_BASE}/pipelines/chunk`, { method: "POST" });
  return handle(res);
}

export async function indexChunks(): Promise<IndexResult> {
  const res = await fetch(`${API_BASE}/pipelines/index`, { method: "POST" });
  return handle(res);
}

export async function searchRecipes(payload: QueryRequest): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}
