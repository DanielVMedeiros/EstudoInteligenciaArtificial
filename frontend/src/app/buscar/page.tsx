"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import * as Select from "@radix-ui/react-select";
import * as Slider from "@radix-ui/react-slider";
import { searchRecipes } from "@/lib/api";
import type { Categoria, CitationItem, QueryFilters } from "@/lib/types";
import { CitationDialog } from "@/components/citation-dialog";

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: "sobremesa", label: "Sobremesa" },
  { value: "prato_principal", label: "Prato principal" },
  { value: "bebida", label: "Bebida" },
  { value: "lanche", label: "Lanche" },
];

const TAGS = ["vegano", "sem_lactose", "sem_gluten", "rapido", "vegetariano"];

const STAGGER = [
  "anim-delay-50",
  "anim-delay-100",
  "anim-delay-150",
  "anim-delay-200",
  "anim-delay-250",
] as const;

export default function BuscarPage() {
  const [pergunta, setPergunta] = useState("");
  const [categoria, setCategoria] = useState<Categoria | "">("");
  const [tempoMax, setTempoMax] = useState(60);
  const [tempoEnabled, setTempoEnabled] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);

  const { mutate, data, isPending, isError, error, isIdle } = useMutation({
    mutationFn: searchRecipes,
  });

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filtros: QueryFilters = {};
    if (categoria) filtros.categoria = categoria;
    if (tempoEnabled) filtros.tempo_max = tempoMax;
    if (tags.length) filtros.tags_qualquer = tags;
    mutate({
      pergunta: pergunta.trim(),
      filtros: Object.keys(filtros).length ? filtros : undefined,
    });
  }

  function renderAnswer(text: string, citacoes: CitationItem[]) {
    return text.split(/(\[\d+\])/g).map((part, i) => {
      const m = part.match(/^\[(\d+)\]$/);
      if (!m) return <span key={i}>{part}</span>;
      const n = Number(m[1]);
      const cit = citacoes.find((c) => c.n === n);
      if (!cit) return <span key={i}>{part}</span>;
      return (
        <button
          key={i}
          type="button"
          onClick={() => setActiveCitation(cit)}
          className="citation-badge"
        >
          {part}
        </button>
      );
    });
  }

  const canSearch = pergunta.trim().length > 0 && pergunta.length <= 500;

  return (
    <main className="min-h-screen px-4 pb-20">

      {/* ─── Hero ─── */}
      <header className="text-center pt-16 pb-10">
        <div className="eyebrow-badge anim-fade-down">
          <span aria-hidden="true">✦</span>
          Busca com Inteligência Artificial
        </div>
        <h1 className="anim-fade-up anim-delay-100 font-serif text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight mb-4 text-gradient">
          Buscador de Receitas
        </h1>
        <p className="anim-fade-up anim-delay-200 text-stone-400 text-base max-w-md mx-auto leading-relaxed">
          Pergunte em linguagem natural e receba sugestões com citações rastreáveis.
        </p>
        <Link
          href="/upload"
          className="anim-fade-up anim-delay-300 inline-block mt-5 text-sm text-orange-500/60 hover:text-orange-400 transition-colors duration-200"
        >
          Cadastrar receitas →
        </Link>
      </header>

      <div className="max-w-2xl mx-auto space-y-4">

        {/* ─── Form card ─── */}
        <div className="glass rounded-2xl p-6 anim-slide-up anim-delay-200">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Pergunta */}
            <div className="space-y-2">
              <label
                htmlFor="pergunta"
                className="block text-[0.7rem] font-bold tracking-[0.12em] uppercase text-stone-500"
              >
                O que você procura?
              </label>
              <textarea
                id="pergunta"
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                placeholder='"sobremesa com chocolate sem leite"'
                rows={3}
                maxLength={500}
                className="form-input px-4 py-3 resize-none"
              />
              <p className="text-[0.72rem] text-stone-600 text-right">{pergunta.length}/500</p>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-2 gap-4">

              {/* Categoria */}
              <div className="space-y-2">
                <label className="block text-[0.7rem] font-bold tracking-[0.12em] uppercase text-stone-500">
                  Categoria
                </label>
                <Select.Root
                  value={categoria === "" ? "all" : categoria}
                  onValueChange={(v) => setCategoria(v === "all" ? "" : (v as Categoria))}
                >
                  <Select.Trigger className="form-input flex items-center justify-between px-4 py-2.5 data-[placeholder]:text-stone-500 text-stone-300">
                    <Select.Value placeholder="Todas" />
                    <Select.Icon className="text-stone-500 text-xs ml-2 shrink-0">▾</Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      position="popper"
                      sideOffset={6}
                      className="z-50 w-[var(--radix-select-trigger-width)] rounded-xl border border-stone-700/70 bg-[#1a1714] shadow-2xl overflow-hidden"
                    >
                      <Select.Viewport className="p-1.5">
                        <Select.Item
                          value="all"
                          className="px-3 py-2 text-sm rounded-lg cursor-pointer text-stone-400 hover:bg-white/5 focus:outline-none focus:bg-white/5 transition-colors"
                        >
                          <Select.ItemText>Todas</Select.ItemText>
                        </Select.Item>
                        {CATEGORIAS.map((c) => (
                          <Select.Item
                            key={c.value}
                            value={c.value}
                            className="px-3 py-2 text-sm rounded-lg cursor-pointer text-stone-300 hover:bg-orange-500/10 hover:text-orange-400 focus:outline-none focus:bg-orange-500/10 focus:text-orange-400 transition-colors"
                          >
                            <Select.ItemText>{c.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              {/* Tempo máximo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[0.7rem] font-bold tracking-[0.12em] uppercase text-stone-500">
                    Tempo máx.
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={tempoEnabled}
                      onChange={(e) => setTempoEnabled(e.target.checked)}
                      className="rounded border-stone-600 accent-orange-500 w-3.5 h-3.5"
                    />
                    <span className={`text-xs font-medium transition-colors ${tempoEnabled ? "text-orange-400" : "text-stone-600"}`}>
                      {tempoEnabled ? `${tempoMax} min` : "desligado"}
                    </span>
                  </label>
                </div>
                <Slider.Root
                  disabled={!tempoEnabled}
                  min={5}
                  max={120}
                  step={5}
                  value={[tempoMax]}
                  onValueChange={([v]) => setTempoMax(v)}
                  className="relative flex items-center select-none w-full h-6"
                >
                  <Slider.Track className="bg-stone-700/60 relative grow rounded-full h-1.5">
                    <Slider.Range
                      className={`absolute rounded-full h-full transition-all ${
                        tempoEnabled ? "bg-gradient-to-r from-orange-500 to-orange-400" : "bg-stone-600"
                      }`}
                    />
                  </Slider.Track>
                  <Slider.Thumb
                    aria-label="Tempo máximo"
                    className="block w-4 h-4 bg-[#0c0a09] border-2 border-orange-500 rounded-full shadow-lg shadow-orange-500/25 focus:outline-none focus:ring-2 focus:ring-orange-500/35 disabled:opacity-25 disabled:cursor-not-allowed transition-all hover:scale-110"
                  />
                </Slider.Root>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2.5">
              <p className="text-[0.7rem] font-bold tracking-[0.12em] uppercase text-stone-500">Tags</p>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                        border transition-all duration-200 select-none
                        ${active
                          ? "bg-orange-500/13 border-orange-500/44 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.18)] scale-105"
                          : "bg-white/4 border-stone-700/50 text-stone-500 hover:border-stone-600/80 hover:text-stone-300 hover:bg-white/6"
                        }
                      `}
                    >
                      {active && (
                        <span className="text-[9px] font-black leading-none">✓</span>
                      )}
                      {tag.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSearch || isPending}
              className="btn-glow w-full py-3 rounded-xl text-sm"
            >
              <span>{isPending ? "Buscando…" : "Buscar receitas"}</span>
            </button>
          </form>
        </div>

        {/* ─── Idle ─── */}
        {isIdle && (
          <p className="anim-fade-in text-center text-stone-600 text-sm py-6">
            Descreva o que você quer cozinhar — ingredientes, restrições ou tipo de prato.
          </p>
        )}

        {/* ─── Loading ─── */}
        {isPending && (
          <div className="anim-fade-in text-center py-10 space-y-4">
            <div className="dot-loader">
              <span /><span /><span />
            </div>
            <p className="text-stone-500 text-sm">Buscando receitas relevantes…</p>
          </div>
        )}

        {/* ─── Erro ─── */}
        {isError && (
          <div className="anim-slide-up glass rounded-2xl p-5 border border-red-500/20">
            <p className="text-sm text-red-400 font-medium">
              {(error as Error)?.message ?? "Erro ao buscar receitas"}
            </p>
            <p className="text-xs text-stone-600 mt-1.5">
              Verifique a conexão com a API e tente novamente.
            </p>
          </div>
        )}

        {/* ─── Resultado ─── */}
        {data && !isPending && (
          <article className="glass rounded-2xl p-6 space-y-6 anim-slide-up">
            {data.citacoes.length === 0 ? (
              <p className="text-stone-400 text-sm">{data.resposta}</p>
            ) : (
              <>
                {/* Resposta */}
                <div>
                  <h2 className="text-[0.68rem] font-bold tracking-[0.13em] uppercase text-stone-600 mb-3">
                    Resposta
                  </h2>
                  <p className="text-stone-200 leading-relaxed text-sm anim-fade-in anim-delay-100">
                    {renderAnswer(data.resposta, data.citacoes)}
                  </p>
                </div>

                {/* Fontes */}
                <div className="border-t border-stone-700/50 pt-5">
                  <h2 className="text-[0.68rem] font-bold tracking-[0.13em] uppercase text-stone-600 mb-3">
                    Fontes
                  </h2>
                  <ul className="space-y-1.5">
                    {data.citacoes.map((cit, idx) => (
                      <li
                        key={cit.n}
                        className={`anim-fade-in ${STAGGER[idx] ?? "anim-delay-300"}`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveCitation(cit)}
                          className="group flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl hover:bg-orange-500/8 border border-transparent hover:border-orange-500/20 transition-all duration-200"
                        >
                          <span className="citation-badge shrink-0">[{cit.n}]</span>
                          <span className="text-sm text-stone-400 group-hover:text-orange-400 transition-colors duration-200 truncate">
                            {cit.titulo}
                          </span>
                          <span className="ml-auto text-stone-700 group-hover:text-orange-500 transition-colors text-xs shrink-0">
                            →
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </article>
        )}
      </div>

      <CitationDialog
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </main>
  );
}
