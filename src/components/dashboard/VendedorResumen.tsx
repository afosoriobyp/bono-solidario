"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, TrendingUp, Ticket, Receipt, Plus } from "lucide-react";
import { BarChart, HorizontalBarList } from "@/components/dashboard/Charts";
import { FullSpinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/utils/helpers";

type Reporte = {
  kpis: {
    ventasMes: number;
    ventasAnio: number;
    ingresosMes: number;
    ingresosAnio: number;
    bonosVendidosMes: number;
    ventasPendientes: number;
  };
  ventasPorMes: { label: string; total: number }[];
  topBonos: { nombre: string; cantidad: number; ingresos: number }[];
};

export default function VendedorResumen() {
  const [reporte, setReporte] = useState<Reporte | null>(null);

  useEffect(() => {
    fetch("/api/reportes?scope=personal")
      .then((r) => r.json())
      .then((d) => setReporte(d.reporte));
  }, []);

  if (!reporte) return <FullSpinner label="Cargando tus indicadores..." />;

  const k = reporte.kpis;

  const kpis = [
    { label: "Mis ventas del mes", valor: k.ventasMes, icono: Receipt, color: "text-brand-600 bg-brand-50" },
    { label: "Mis ventas del año", valor: k.ventasAnio, icono: TrendingUp, color: "text-blue-600 bg-blue-50" },
    { label: "Ingresos del mes", valor: formatCurrency(k.ingresosMes), icono: Wallet, color: "text-violet-600 bg-violet-50" },
    { label: "Bonos vendidos (mes)", valor: k.bonosVendidosMes, icono: Ticket, color: "text-amber-600 bg-amber-50" }
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel del vendedor</h1>
          <p className="text-sm text-slate-500">Tus indicadores personales</p>
        </div>
        <Link href="/vendedor/bonos" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo bono
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icono = kpi.icono;
          return (
            <div key={kpi.label} className="card p-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.color}`}>
                  <Icono className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                  <p className="text-lg font-bold text-slate-900">{kpi.valor}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Mis ventas por mes</h2>
          <BarChart data={reporte.ventasPorMes} />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Mis bonos más vendidos</h2>
          <HorizontalBarList data={reporte.topBonos} />
        </div>
      </div>
    </div>
  );
}