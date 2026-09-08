"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import BonoCard from "@/components/bonos/BonoCard";
import { FullSpinner } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";

type Bono = {
  _id: string;
  titulo: string;
  descripcion: string;
  valor: number;
  fechaEmision: string;
  imagen?: string;
  estado: string;
  stock?: number | null;
};

export default function BonosPage() {
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [cargando, setCargando] = useState(true);
  const [search, setSearch] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [emisionDesde, setEmisionDesde] = useState("");

  async function cargarBonos() {
    setCargando(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    if (emisionDesde) params.set("emisionDesde", emisionDesde);

    try {
      const res = await fetch(`/api/bonos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBonos(data.bonos);
      }
    } catch {
      setBonos([]);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(cargarBonos, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, min, max, emisionDesde]);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Bonos disponibles</h1>
        <p className="mt-1 text-slate-500">
          Encuentra el bono solidario perfecto para apoyar una causa.
        </p>
      </div>

      {/* Filtros */}
      <div className="card mb-8 p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="label">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título..."
                className="input pl-9"
              />
            </div>
          </div>
          <div>
            <label className="label">Precio mínimo</label>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder="0"
              className="input"
            />
          </div>
          <div>
            <label className="label">Precio máximo</label>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder="Sin límite"
              className="input"
            />
          </div>
          <div>
            <label className="label">Emisión desde</label>
            <input
              type="date"
              value={emisionDesde}
              onChange={(e) => setEmisionDesde(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {cargando ? (
        <FullSpinner label="Cargando bonos..." />
      ) : bonos.length === 0 ? (
        <EmptyState
          titulo="No se encontraron bonos"
          descripcion="Ajusta tus filtros o intenta con otra búsqueda."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bonos.map((bono) => (
            <BonoCard key={bono._id} bono={bono} />
          ))}
        </div>
      )}
    </div>
  );
}