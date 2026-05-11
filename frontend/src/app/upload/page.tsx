"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { uploadCsv, chunkRecipes, indexChunks } from "@/lib/api";
import type { IngestResult } from "@/lib/types";

type Step = "idle" | "ingesting" | "chunking" | "indexing" | "done" | "error";

const STEP_LABELS: Record<string, string> = {
  ingesting: "Importando receitas",
  chunking: "Criando fragmentos de texto",
  indexing: "Gerando embeddings e indexando",
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

  const statsData = ingestResult
    ? [
        { label: "Criadas", value: ingestResult.criadas, color: "text-emerald-400", ring: "ring-emerald-500/30", bg: "bg-emerald-500/8" },
        { label: "Atualizadas", value: ingestResult.atualizadas, color: "text-orange-400", ring: "ring-orange-500/30", bg: "bg-orange-500/8" },
        { label: "Ignoradas", value: ingestResult.ignoradas, color: "text-stone-400", ring: "ring-stone-500/20", bg: "bg-stone-500/8" },
        ...(chunksCreated !== null ? [{ label: "Fragmentos", value: chunksCreated, color: "text-blue-400", ring: "ring-blue-500/25", bg: "bg-blue-500/8" }] : []),
        ...(chunksIndexed !== null ? [{ label: "Indexados", value: chunksIndexed, color: "text-violet-400", ring: "ring-violet-500/25", bg: "bg-violet-500/8" }] : []),
      ]
    : [];

  const STAGGER = ["anim-delay-50", "anim-delay-100", "anim-delay-150", "anim-delay-200", "anim-delay-250"] as const;

  return (
    <main className="min-h-screen px-4 pb-20">

      {/* ─── Hero ─── */}
      <header className="text-center pt-16 pb-10">
        <div className="eyebrow-badge anim-fade-down">
          <span aria-hidden="true">✦</span>
          Cadastro de Receitas
        </div>
        <h1 className="anim-fade-up anim-delay-100 font-serif text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight mb-4 text-gradient">
          Cadastrar Receitas
        </h1>
        <p className="anim-fade-up anim-delay-200 text-stone-400 text-base max-w-md mx-auto leading-relaxed">
          Envie um CSV com colunas: id, titulo, ingredientes, modo_preparo, categoria, tempo_preparo, tags.
        </p>
        <Link
          href="/buscar"
          className="anim-fade-up anim-delay-300 inline-block mt-5 text-sm text-orange-500/60 hover:text-orange-400 transition-colors duration-200"
        >
          ← Voltar à busca
        </Link>
      </header>

      <div className="max-w-2xl mx-auto space-y-4">

        {/* ─── Form ─── */}
        <form
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-6 anim-slide-up anim-delay-200 space-y-5"
        >
          <div>
            <label className="block text-[0.7rem] font-bold tracking-[0.12em] uppercase text-stone-500 mb-2">
              Arquivo CSV
            </label>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              disabled={busy}
              className="
                w-full text-sm text-stone-400 cursor-pointer
                file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0
                file:text-xs file:font-bold file:tracking-wide
                file:bg-orange-500/10 file:text-orange-400
                hover:file:bg-orange-500/18 file:transition-colors file:duration-200
                file:cursor-pointer
                disabled:opacity-35 disabled:cursor-not-allowed
              "
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="btn-glow w-full py-3 rounded-xl text-sm"
          >
            <span>{busy ? `${STEP_LABELS[step]}…` : "Enviar CSV"}</span>
          </button>
        </form>

        {/* ─── Pipeline em progresso ─── */}
        {busy && (
          <div className="glass rounded-2xl p-6 anim-slide-up space-y-5">
            <div className="dot-loader">
              <span /><span /><span />
            </div>
            <div className="space-y-3">
              {PIPELINE_STEPS.map((s) => {
                const sOrder = stepOrder[s];
                const isDone = currentOrder > sOrder;
                const isActive = s === step;
                return (
                  <div
                    key={s}
                    className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                      isDone
                        ? "text-emerald-400"
                        : isActive
                        ? "text-orange-400 font-medium"
                        : "text-stone-700"
                    }`}
                    style={{ animation: "stepReveal 0.3s ease both" }}
                  >
                    <span
                      className={`step-dot ${
                        isDone ? "step-dot-done" : isActive ? "step-dot-active" : "step-dot-pending"
                      }`}
                    >
                      {isDone ? "✓" : isActive ? "·" : "○"}
                    </span>
                    <span>{STEP_LABELS[s]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Erro ─── */}
        {step === "error" && (
          <div className="anim-slide-up glass rounded-2xl p-5 border border-red-500/22">
            <p className="text-sm text-red-400 font-medium">{errorMsg}</p>
          </div>
        )}

        {/* ─── Resultado ─── */}
        {step === "done" && ingestResult && (
          <article className="glass rounded-2xl p-6 space-y-6 anim-slide-up">

            {/* Header com check */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-sm text-emerald-400 font-bold shrink-0">
                ✓
              </div>
              <div>
                <h2 className="font-serif font-bold text-stone-100">Pipeline concluído</h2>
                <p className="text-xs text-stone-600 mt-0.5">Receitas processadas e indexadas com sucesso</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {statsData.map((item, idx) => (
                <div
                  key={item.label}
                  className={`${item.bg} rounded-xl p-4 ring-1 ${item.ring} anim-stat-pop ${STAGGER[idx] ?? "anim-delay-250"}`}
                >
                  <p className={`text-2xl font-black font-serif ${item.color}`}>{item.value}</p>
                  <p className="text-[0.7rem] text-stone-500 mt-0.5 font-medium uppercase tracking-wide">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Erros */}
            {ingestResult.erros.length > 0 && (
              <div className="border-t border-stone-700/50 pt-4 space-y-2">
                <p className="text-[0.68rem] font-bold tracking-[0.13em] uppercase text-stone-600">Erros</p>
                <ul className="text-sm text-red-400/80 space-y-1.5">
                  {ingestResult.erros.map((e, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="shrink-0 text-red-500/60 mt-0.5">⚠</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              href="/buscar"
              className="inline-flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300 transition-colors font-medium"
            >
              Buscar receitas →
            </Link>
          </article>
        )}
      </div>
    </main>
  );
}
