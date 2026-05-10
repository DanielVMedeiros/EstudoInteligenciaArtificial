"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import * as Select from "@radix-ui/react-select";
import * as Slider from "@radix-ui/react-slider";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Label from "@radix-ui/react-label";
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
          className="inline-block px-1 py-0.5 text-amber-700 bg-amber-50 border border-amber-200 rounded text-sm font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
        >
          {part}
        </button>
      );
    });
  }

  const canSearch = pergunta.trim().length > 0 && pergunta.length <= 500;

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Buscador de Receitas</h1>
            <p className="text-stone-500 mt-1 text-sm">
              Pergunte em linguagem natural e receba sugestões com citações rastreáveis.
            </p>
          </div>
          <Link
            href="/upload"
            className="shrink-0 text-sm text-amber-700 hover:text-amber-900 hover:underline transition-colors"
          >
            Cadastrar receitas →
          </Link>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-5"
        >
          {/* Pergunta */}
          <div className="space-y-1.5">
            <Label.Root
              htmlFor="pergunta"
              className="text-sm font-medium text-stone-700"
            >
              O que você procura?
            </Label.Root>
            <textarea
              id="pergunta"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              placeholder='"sobremesa com chocolate sem leite"'
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-stone-300"
            />
            <p className="text-xs text-stone-400 text-right">{pergunta.length}/500</p>
          </div>

          {/* Filtros em grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Categoria */}
            <div className="space-y-1.5">
              <Label.Root className="text-sm font-medium text-stone-700">
                Categoria
              </Label.Root>
              <Select.Root
                value={categoria === "" ? "all" : categoria}
                onValueChange={(v) => setCategoria(v === "all" ? "" : (v as Categoria))}
              >
                <Select.Trigger className="w-full flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-stone-700">
                  <Select.Value placeholder="Todas" />
                  <Select.Icon className="text-stone-400 text-xs">▾</Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    position="popper"
                    className="bg-white rounded-xl shadow-lg border border-stone-200 z-50 w-full"
                  >
                    <Select.Viewport className="p-1">
                      <Select.Item
                        value="all"
                        className="px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-stone-50 focus:outline-none focus:bg-stone-50 text-stone-500"
                      >
                        <Select.ItemText>Todas</Select.ItemText>
                      </Select.Item>
                      {CATEGORIAS.map((c) => (
                        <Select.Item
                          key={c.value}
                          value={c.value}
                          className="px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-stone-50 focus:outline-none focus:bg-stone-50"
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label.Root className="text-sm font-medium text-stone-700">
                  Tempo máx.
                </Label.Root>
                <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={tempoEnabled}
                    onChange={(e) => setTempoEnabled(e.target.checked)}
                    className="rounded border-stone-300"
                  />
                  {tempoEnabled ? `${tempoMax} min` : "desligado"}
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
                <Slider.Track className="bg-stone-200 relative grow rounded-full h-1.5">
                  <Slider.Range className="absolute bg-amber-400 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb
                  aria-label="Tempo máximo"
                  className="block w-4 h-4 bg-white border-2 border-amber-400 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-40"
                />
              </Slider.Root>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-700">Tags</p>
            <div className="flex flex-wrap gap-3">
              {TAGS.map((tag) => (
                <div key={tag} className="flex items-center gap-1.5">
                  <Checkbox.Root
                    id={`tag-${tag}`}
                    checked={tags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                    className="w-4 h-4 rounded border border-stone-300 bg-white flex items-center justify-center data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <Checkbox.Indicator className="text-white text-[10px] font-bold leading-none">
                      ✓
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  <Label.Root
                    htmlFor={`tag-${tag}`}
                    className="text-sm text-stone-600 cursor-pointer select-none"
                  >
                    {tag}
                  </Label.Root>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSearch || isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {isPending ? "Buscando…" : "Buscar"}
          </button>
        </form>

        {/* Estados */}
        {isIdle && (
          <p className="text-center text-stone-400 text-sm">
            Descreva o que você quer cozinhar — ingredientes, restrições ou tipo de prato.
          </p>
        )}

        {isPending && (
          <p className="text-center text-stone-500 text-sm animate-pulse">
            Buscando receitas relevantes…
          </p>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">
              {(error as Error)?.message ?? "Erro ao buscar receitas"}
            </p>
            <p className="text-xs text-red-400 mt-1">
              Verifique a conexão com a API e tente novamente.
            </p>
          </div>
        )}

        {data && (
          <article className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4">
            {data.citacoes.length === 0 ? (
              <p className="text-stone-500 text-sm">{data.resposta}</p>
            ) : (
              <>
                <p className="text-stone-800 leading-relaxed text-sm">
                  {renderAnswer(data.resposta, data.citacoes)}
                </p>

                <div className="border-t border-stone-100 pt-4 space-y-1">
                  <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                    Fontes
                  </h2>
                  <ul className="space-y-1">
                    {data.citacoes.map((cit) => (
                      <li key={cit.n}>
                        <button
                          type="button"
                          onClick={() => setActiveCitation(cit)}
                          className="text-sm text-amber-700 hover:text-amber-900 hover:underline text-left transition-colors"
                        >
                          [{cit.n}] {cit.titulo}
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
