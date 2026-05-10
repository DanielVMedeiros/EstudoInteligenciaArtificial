import type {
  IngestionJob,
  Recipe,
  SearchRequest,
  SearchResponse,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = typeof body.detail === "string" ? body.detail : "Erro na API";
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export async function searchRecipes(
  payload: SearchRequest,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  return handleResponse<SearchResponse>(response);
}

export async function uploadCsv(file: File): Promise<{ job_id: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/api/ingest`, {
    method: "POST",
    body: formData,
  });
  return handleResponse(response);
}

export async function getIngestionJob(jobId: string): Promise<IngestionJob> {
  const response = await fetch(`${API_BASE}/api/ingest/${jobId}`);
  return handleResponse<IngestionJob>(response);
}

export async function getRecipe(recipeId: string): Promise<Recipe> {
  const response = await fetch(`${API_BASE}/api/recipes/${recipeId}`);
  return handleResponse<Recipe>(response);
}
