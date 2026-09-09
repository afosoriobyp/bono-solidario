"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

type NumeroSelectorProps = {
  bonoId: string;
  titulo: string;
  numeros: string[];
  disponibles: string[];
  onChange: (numeros: string[]) => void;
};

export default function NumeroSelector({
  numeros,
  disponibles,
  onChange
}: NumeroSelectorProps) {
  const [seleccion, setSeleccion] = useState("");

  const seleccionados = new Set(numeros);
  const opciones = disponibles.filter((n) => !seleccionados.has(n));

  function agregar() {
    if (!seleccion) return;
    onChange([...numeros, seleccion]);
    setSeleccion("");
  }

  function quitar(numero: string) {
    onChange(numeros.filter((n) => n !== numero));
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        {numeros.length === 0 ? (
          <span className="text-sm text-slate-400">Sin números seleccionados.</span>
        ) : (
          numeros.map((n) => (
            <span
              key={n}
              className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-800"
            >
              {n}
              <button
                onClick={() => quitar(n)}
                className="text-brand-600 hover:text-red-600"
                aria-label={`Quitar número ${n}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <select
          value={seleccion}
          onChange={(e) => setSeleccion(e.target.value)}
          className="input w-44"
          disabled={opciones.length === 0}
        >
          <option value="">Número disponible</option>
          {opciones.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button
          onClick={agregar}
          disabled={!seleccion || opciones.length === 0}
          className="btn-secondary px-3 py-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      {opciones.length === 0 && (
        <p className="mt-1 text-xs text-red-600">No quedan números disponibles.</p>
      )}
    </div>
  );
}