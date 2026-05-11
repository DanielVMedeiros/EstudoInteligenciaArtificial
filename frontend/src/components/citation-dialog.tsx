"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { CitationItem } from "@/lib/types";

interface Props {
  citation: CitationItem | null;
  onClose: () => void;
}

export function CitationDialog({ citation, onClose }: Props) {
  return (
    <Dialog.Root open={citation !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 anim-fade-in"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(5px)", zIndex: 9998 }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-md focus:outline-none anim-scale-in"
          style={{ zIndex: 9999 }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#0c0a09",
              border: "1px solid rgba(87,83,78,0.55)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Header */}
            <div
              className="px-6 pt-5 pb-4 flex items-start justify-between gap-4"
              style={{ borderBottom: "1px solid rgba(87,83,78,0.4)" }}
            >
              <div>
                <p
                  className="text-[0.65rem] font-bold tracking-[0.13em] uppercase mb-1"
                  style={{ color: "#fb923c" }}
                >
                  Fonte
                </p>
                <Dialog.Title
                  className="font-serif text-base font-bold leading-snug"
                  style={{ color: "#fafaf9" }}
                >
                  {citation && `[${citation.n}] ${citation.titulo}`}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  aria-label="Fechar"
                  className="shrink-0 w-7 h-7 mt-0.5 rounded-lg flex items-center justify-center text-base leading-none transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(87,83,78,0.6)", color: "#a8a29e" }}
                  onMouseEnter={e => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = "rgba(239,68,68,0.12)";
                    b.style.borderColor = "rgba(239,68,68,0.4)";
                    b.style.color = "#f87171";
                  }}
                  onMouseLeave={e => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = "rgba(255,255,255,0.05)";
                    b.style.borderColor = "rgba(87,83,78,0.6)";
                    b.style.color = "#a8a29e";
                  }}
                >
                  ×
                </button>
              </Dialog.Close>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <Dialog.Description
                className="text-sm leading-relaxed anim-fade-in anim-delay-100"
                style={{ color: "#e7e5e4" }}
              >
                {citation?.trecho}
              </Dialog.Description>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
