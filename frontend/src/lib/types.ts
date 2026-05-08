export type Categoria = "sobremesa" | "prato_principal" | "bebida" | "lanche";

export interface QueryFilters {
  categoria?: Categoria | null;
  tempo_max?: number | null;
  tags_qualquer?: string[];
}

export interface QueryRequest {
  pergunta: string;
  filtros?: QueryFilters;
}

export interface CitationItem {
  n: number;
  receita_id: string;
  titulo: string;
  trecho: string;
}

export interface QueryResponse {
  resposta: string;
  citacoes: CitationItem[];
}

export interface IngestResult {
  criadas: number;
  atualizadas: number;
  ignoradas: number;
  erros: string[];
}

export interface ChunkResult {
  receitas_processadas: number;
  chunks_criados: number;
}

export interface IndexResult {
  chunks_indexados: number;
}
