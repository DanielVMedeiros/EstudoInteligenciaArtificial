"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { uploadCsv, chunkRecipes, indexChunks } from "@/lib/api";
import type { IngestResult } from "@/lib/types";

type Step = "idle" | "ingesting" | "chunking" | "indexing" | "done" | "error";

const STEP_LABELS: Record<string, string> = {
  ingesting: "Importando receitas…",
  chunking: "Criando fragmentos de texto…",
  indexing: "Gerando embeddings e indexando…",
};

const PIPELINE_STEPS: Step[] = ["ingesting", "chunking", "indexing"];

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("idle");
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [chunksCreated, setChunksCreated] = useState<number | null>(null);
  const [chunksIndexed, setChunksIndexed] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const busy = step === "ingesting" || step === "chunking" || step === "indexing";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setStep("ingesting");
    setIngestResult(null);
    setChunksCreated(null);
    setChunksIndexed(null);
    setErrorMsg(null);

    try {
      const ingest = await uploadCsv(file);
      setIngestResult(ingest);

      setStep("chunking");
      const chunk = await chunkRecipes();
      setChunksCreated(chunk.chunks_criados);

      setStep("indexing");
      const index = await indexChunks();
      setChunksIndexed(index.chunks_indexados);

      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Falha no processamento");
      setStep("error");
    }
  }

  const stepOrder: Record<string, number> = { ingesting: 0, chunking: 1, indexing: 2 };
  const currentOrder = stepOrder[step] ?? -1;

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Cadastrar receitas</h1>
            <p className="text-stone-500 mt-1 text-sm">
              Envie um CSV com colunas: id, titulo, ingredientes, modo_preparo, categoria, tempo_preparo, tags.
            </p>
          </div>
          <Link
            href="/buscar"
            className="shrink-0 text-sm text-amber-700 hover:text-amber-900 hover:underline transition-colors"
          >
            ← Voltar à busca
          </Link>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-5"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            disabled={busy}
            className="w-full text-sm text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {busy ? STEP_LABELS[step] : "Enviar CSV"}
          </button>
        </form>

        {busy && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-3">
            {PIPELINE_STEPS.map((s) => {
              const sOrder = stepOrder[s];
              const isDone = currentOrder > sOrder;
              const isActive = s === step;
              return (
                <div
                  key={s}
                  className={`text-sm flex items-center gap-2 ${
                    isDone
                      ? "text-stone-400 line-through"
                      : isActive
                      ? "text-stone-800 font-medium animate-pulse"
                      : "text-stone-300"
                  }`}
                >
                  <span>{isDone ? "✓" : isActive ? "…" : "○"}</span>
                  <span>{STEP_LABELS[s]}</span>
                </div>
              );
            })}
          </div>
        )}

        {step === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        {step === "done" && ingestResult && (
          <article className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4">
            <h2 className="font-semibold text-stone-900">Resultado</h2>
            <ul className="text-sm text-stone-700 space-y-1">
              <li>{ingestResult.criadas} receitas criadas</li>
              <li>{ingestResult.atualizadas} atualizadas</li>
              <li>{ingestResult.ignoradas} ignoradas</li>
              {chunksCreated !== null && <li>{chunksCreated} fragmentos gerados</li>}
              {chunksIndexed !== null && <li>{chunksIndexed} fragmentos indexados</li>}
            </ul>
            {ingestResult.erros.length > 0 && (
              <div className="border-t border-stone-100 pt-4 space-y-1">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Erros</p>
                <ul className="text-sm text-red-600 space-y-1">
                  {ingestResult.erros.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              href="/buscar"
              className="inline-block text-sm text-amber-700 hover:text-amber-900 hover:underline transition-colors"
            >
              Buscar receitas →
            </Link>
          </article>
        )}
      </div>
    </main>
  );
}
