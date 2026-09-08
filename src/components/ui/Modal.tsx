"use client";

import { X } from "lucide-react";

type ModalProps = {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Modal({ abierto, onCerrar, titulo, children, footer }: ModalProps) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onCerrar} aria-hidden />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{titulo}</h3>
          <button onClick={onCerrar} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}