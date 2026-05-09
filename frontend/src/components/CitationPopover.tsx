import { useEffect, useState } from "react";
import type { Categoria, Citation } from "../types";
import { getRecipe } from "../api";

interface CitationPopoverProps {
  citation: Citation;
  onClose: () => void;
}

export default function CitationPopover({ citation, onClose }: CitationPopoverProps) {
  const [detail, setDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      try {
        const recipe = await getRecipe(citation.id);
        if (!cancelled) {
          setDetail(
            `${recipe.titulo}\n\nIngredientes: ${recipe.ingredientes.join(", ")}\n\n${recipe.modo_preparo.slice(0, 300)}…`,
          );
        }
      } catch {
        if (!cancelled) setDetail(citation.trecho);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [citation]);

  return (
    <div className="popover-backdrop" onClick={onClose} role="presentation">
      <div
        className="popover"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="citation-title"
      >
        <header>
          <h3 id="citation-title">
            [{citation.ref}] {citation.titulo}
          </h3>
          <button type="button" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        {loading ? <p className="muted">Carregando…</p> : <p className="popover-body">{detail}</p>}
      </div>
    </div>
  );
}

export const CATEGORIA_OPTIONS: { value: Categoria | ""; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "sobremesa", label: "Sobremesa" },
  { value: "prato_principal", label: "Prato principal" },
  { value: "bebida", label: "Bebida" },
];

export const TAG_OPTIONS = ["vegano", "sem_lactose", "sem_gluten"];
