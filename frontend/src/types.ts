export type Categoria = "sobremesa" | "prato_principal" | "bebida";

export interface Citation {
  ref: number;
  id: string;
  titulo: string;
  trecho: string;
}

export interface RecipeSummary {
  id: string;
  titulo: string;
  categoria: Categoria;
  tempo_preparo: number;
  tags: string[];
}

export interface SearchResponse {
  resposta: string;
  citacoes: Citation[];
  receitas_recuperadas: RecipeSummary[];
}

export interface SearchRequest {
  pergunta: string;
  categoria?: Categoria | null;
  tempo_maximo?: number | null;
  tags?: string[];
  limite?: number;
}

export interface IngestionSummary {
  linhas_lidas: number;
  cadastradas: number;
  atualizadas: number;
  rejeitadas: number;
  ja_existentes: number;
}

export type IngestionStatus = "em_andamento" | "concluido" | "com_erro";

export interface LineError {
  linha: number;
  mensagem: string;
}

export interface IngestionJob {
  job_id: string;
  status: IngestionStatus;
  resumo: IngestionSummary;
  erros: LineError[];
}

export interface Recipe {
  id: string;
  titulo: string;
  ingredientes: string[];
  modo_preparo: string;
  categoria: Categoria;
  tempo_preparo: number;
  tags: string[];
  fonte?: string | null;
}
