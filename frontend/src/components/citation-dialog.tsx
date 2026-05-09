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
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md focus:outline-none">
          <Dialog.Title className="text-base font-semibold text-stone-900 mb-3">
            {citation && `[${citation.n}] ${citation.titulo}`}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-stone-600 leading-relaxed">
            {citation?.trecho}
          </Dialog.Description>
          <Dialog.Close asChild>
            <button
              aria-label="Fechar"
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 text-xl leading-none"
            >
              ×
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
