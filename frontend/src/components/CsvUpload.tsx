import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { getIngestionJob, uploadCsv } from "../api";
import type { IngestionJob } from "../types";

// Etapas exibidas enquanto o job está em processamento.
const PROCESSING_STEPS = [
  "Lendo o CSV…",
  "Extraindo o texto das colunas…",
  "Transformando em embeddings…",
  "Vetorizando os dados…",
  "Indexando no banco vetorial…",
];

const STEP_ROTATE_MS = 2200;

export default function CsvUpload() {
  const [job, setJob] = useState<IngestionJob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Vai trocando a mensagem de progresso enquanto o upload/processamento roda
  useEffect(() => {
    if (!uploading) return;
    const timer = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, PROCESSING_STEPS.length - 1));
    }, STEP_ROTATE_MS);
    return () => clearInterval(timer);
  }, [uploading]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Selecione um arquivo CSV");
      return;
    }
    setUploading(true);
    setError(null);
    setJob(null);
    setStepIndex(0);
    try {
      const { job_id } = await uploadCsv(file);
      const result = await getIngestionJob(job_id);
      setJob(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="card upload-card">
      <h2>Cadastro via planilha</h2>
      <p className="muted">
        Envie um CSV com colunas: id, titulo, ingredientes, modo_preparo, categoria, tempo_preparo, tags, fonte.
      </p>
      <form onSubmit={handleSubmit} className="upload-form">
        <input ref={inputRef} type="file" accept=".csv" disabled={uploading} />
        <button type="submit" disabled={uploading}>
          {uploading ? "Enviando…" : "Enviar CSV"}
        </button>
      </form>

      {uploading && (
        <div className="ingestion-progress">
          <span className="spinner" aria-hidden="true" />
          <div>
            <p className="progress-label">{PROCESSING_STEPS[stepIndex]}</p>
            <ul className="progress-steps">
              {PROCESSING_STEPS.map((step, index) => (
                <li
                  key={step}
                  className={
                    index < stepIndex
                      ? "done"
                      : index === stepIndex
                      ? "active"
                      : "pending"
                  }
                >
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {job && !uploading && (
        <div className="ingestion-result">
          <p>
            Status: <strong>{job.status}</strong>
          </p>
          <ul>
            <li>{job.resumo.linhas_lidas} linhas lidas</li>
            <li>{job.resumo.cadastradas} cadastradas</li>
            <li>{job.resumo.atualizadas} atualizadas</li>
            <li>{job.resumo.ja_existentes} já existentes</li>
            <li>{job.resumo.rejeitadas} rejeitadas</li>
          </ul>
          {job.resumo.ja_existentes > 0 && job.resumo.cadastradas === 0 && (
            <p className="muted">
              {job.resumo.ja_existentes} já existentes, 0 novas
            </p>
          )}
          {job.erros.length > 0 && (
            <ul className="error-list">
              {job.erros.map((item) => (
                <li key={item.linha}>
                  Linha {item.linha}: {item.mensagem}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}