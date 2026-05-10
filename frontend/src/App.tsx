import { useCallback, useRef, useState } from "react";
import type { FormEvent } from "react";
import { searchRecipes } from "./api";
import type { Categoria, Citation, SearchResponse } from "./types";
import CitationPopover, { CATEGORIA_OPTIONS, TAG_OPTIONS } from "./components/CitationPopover";
import CsvUpload from "./components/CsvUpload";
import MainMenu from "./components/MainMenu";

type SearchStatus = "idle" | "loading" | "success" | "error" | "empty";
type View = "menu" | "search" | "upload";

export default function App() {
  const [view, setView] = useState<View>("menu");
  const [pergunta, setPergunta] = useState("");
  const [categoria, setCategoria] = useState<Categoria | "">("");
  const [tempoMaximo, setTempoMaximo] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const canSearch = pergunta.trim().length > 0 && pergunta.length <= 500;

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }, []);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (!canSearch) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;

    setStatus("loading");
    setError(null);
    setResult(null);
    setActiveCitation(null);

    try {
      const response = await searchRecipes(
        {
          pergunta: pergunta.trim(),
          categoria: categoria || null,
          tempo_maximo: tempoMaximo ? Number(tempoMaximo) : null,
          tags: selectedTags,
          limite: 5,
        },
        controller.signal,
      );

      if (requestId !== requestIdRef.current) return;

      const isEmpty =
        response.receitas_recuperadas.length === 0 &&
        response.resposta.toLowerCase().includes("não encontrei");

      setResult(response);
      setStatus(isEmpty ? "empty" : "success");
    } catch (err) {
      if (controller.signal.aborted) return;
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Erro ao buscar receitas");
      setStatus("error");
    }
  }

  function clearFilters() {
    setCategoria("");
    setTempoMaximo("");
    setSelectedTags([]);
  }

  function goToMenu() {
    abortRef.current?.abort();
    setView("menu");
  }

  function renderAnswerWithCitations(text: string, citations: Citation[]) {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (!match) {
        return <span key={index}>{part}</span>;
      }
      const ref = Number(match[1]);
      const citation = citations.find((item) => item.ref === ref);
      if (!citation) {
        return <span key={index}>{part}</span>;
      }
      return (
        <button
          key={index}
          type="button"
          className="citation-link"
          onClick={() => setActiveCitation(citation)}
        >
          [{ref}]
        </button>
      );
    });
  }

  return (
    <div className="app">
      <header className="hero">
        <h1>Buscador Inteligente de Receitas</h1>
        <p>Pergunte em linguagem natural e receba sugestões com citações rastreáveis.</p>
      </header>

      {view !== "menu" && (
        <div className="menu-header">
          <button type="button" className="back-button" onClick={goToMenu}>
            ← Voltar ao menu
          </button>
        </div>
      )}

      <main className="layout">
        {view === "menu" && <MainMenu onSelect={setView} />}

        {view === "search" && (
          <section className="card search-card">
            <form onSubmit={handleSearch}>
              <label htmlFor="pergunta">O que você procura?</label>
              <textarea
                id="pergunta"
                value={pergunta}
                onChange={(event) => setPergunta(event.target.value)}
                placeholder='Ex.: "sobremesa com chocolate sem leite"'
                rows={3}
                maxLength={500}
              />
              <p className="char-count">{pergunta.length}/500</p>

              <div className="filters">
                <div>
                  <label htmlFor="categoria">Categoria</label>
                  <select
                    id="categoria"
                    value={categoria}
                    onChange={(event) => setCategoria(event.target.value as Categoria | "")}
                  >
                    {CATEGORIA_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="tempo">Tempo máx. (min)</label>
                  <input
                    id="tempo"
                    type="number"
                    min={1}
                    value={tempoMaximo}
                    onChange={(event) => setTempoMaximo(event.target.value)}
                    placeholder="Ex.: 20"
                  />
                </div>
              </div>

              <fieldset className="tags-fieldset">
                <legend>Tags</legend>
                {TAG_OPTIONS.map((tag) => (
                  <label key={tag} className="tag-chip">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                    />
                    {tag}
                  </label>
                ))}
              </fieldset>

              <div className="actions">
                <button type="submit" disabled={!canSearch || status === "loading"}>
                  {status === "loading" ? "Buscando…" : "Buscar"}
                </button>
                <button type="button" className="secondary" onClick={clearFilters}>
                  Limpar filtros
                </button>
              </div>
              {!canSearch && pergunta.length === 0 && (
                <p className="muted hint">Digite algo para buscar</p>
              )}
            </form>

            <div className="results" aria-live="polite">
              {status === "idle" && (
                <div className="empty-state">
                  <p>Descreva o que você quer cozinhar — ingredientes, restrições ou tipo de prato.</p>
                </div>
              )}

              {status === "loading" && (
                <div className="loading-state">
                  <div className="spinner" />
                  <p>Buscando receitas relevantes…</p>
                </div>
              )}

              {status === "error" && error && (
                <div className="error-state">
                  <p>{error}</p>
                  <p className="muted">Verifique a conexão com a API e tente novamente.</p>
                </div>
              )}

              {status === "empty" && result && (
                <div className="empty-state">
                  <p>{result.resposta}</p>
                  <p className="muted">Tente remover filtros ou reformular a pergunta.</p>
                </div>
              )}

              {status === "success" && result && (
                <article className="answer">
                  <h2>Resposta</h2>
                  <p className="answer-text">
                    {renderAnswerWithCitations(result.resposta, result.citacoes)}
                  </p>

                  {result.citacoes.length > 0 && (
                    <div className="citations">
                      <h3>Citações</h3>
                      <ul>
                        {result.citacoes.map((citation) => (
                          <li key={citation.ref}>
                            <button
                              type="button"
                              className="citation-link"
                              onClick={() => setActiveCitation(citation)}
                            >
                              [{citation.ref}] {citation.titulo}
                            </button>
                            <span className="muted"> — {citation.trecho}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.receitas_recuperadas.length > 0 && (
                    <div className="recipes">
                      <h3>Receitas no contexto</h3>
                      <ul>
                        {result.receitas_recuperadas.map((recipe) => (
                          <li key={recipe.id}>
                            <strong>{recipe.titulo}</strong> — {recipe.categoria},{" "}
                            {recipe.tempo_preparo} min
                            {recipe.tags.length > 0 && (
                              <span className="muted"> ({recipe.tags.join(", ")})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              )}
            </div>
          </section>
        )}

        {view === "upload" && <CsvUpload />}
      </main>

      {activeCitation && (
        <CitationPopover citation={activeCitation} onClose={() => setActiveCitation(null)} />
      )}
    </div>
  );
}
