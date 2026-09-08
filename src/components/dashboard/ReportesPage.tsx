"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  Ticket,
  Receipt,
  Users,
  BadgeCheck,
  BadgeMinus,
  Clock
} from "lucide-react";
import { BarChart, DonutChart, HorizontalBarList } from "@/components/dashboard/Charts";
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
    totalUsuarios: number;
    totalBonos: number;
    bonosActivos: number;
    bonosInactivos: number;
  };
  ventasPorMes: { label: string; total: number }[];
  topBonos: { nombre: string; cantidad: number; ingresos: number }[];
  metodosPago: Record<string, number>;
};

export default function ReportesPage() {
  const [reporte, setReporte] = useState<Reporte | null>(null);

  useEffect(() => {
    fetch("/api/reportes")
      .then((r) => r.json())
      .then((d) => setReporte(d.reporte));
  }, []);

  if (!reporte) return <FullSpinner label="Cargando reportes..." />;

  const k = reporte.kpis;

  const kpis = [
    { label: "Ingresos del mes", valor: formatCurrency(k.ingresosMes), icono: Wallet, color: "text-brand-600 bg-brand-50" },
    { label: "Ingresos del año", valor: formatCurrency(k.ingresosAnio), icono: TrendingUp, color: "text-blue-600 bg-blue-50" },
    { label: "Ventas del mes", valor: k.ventasMes, icono: Receipt, color: "text-violet-600 bg-violet-50" },
    { label: "Bonos vendidos (mes)", valor: k.bonosVendidosMes, icono: Ticket, color: "text-amber-600 bg-amber-50" },
    { label: "Ventas pendientes", valor: k.ventasPendientes, icono: Clock, color: "text-red-600 bg-red-50" },
    { label: "Usuarios registrados", valor: k.totalUsuarios, icono: Users, color: "text-cyan-600 bg-cyan-50" },
    { label: "Bonos activos", valor: k.bonosActivos, icono: BadgeCheck, color: "text-emerald-600 bg-emerald-50" },
    { label: "Bonos inactivos", valor: k.bonosInactivos, icono: BadgeMinus, color: "text-slate-600 bg-slate-100" }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reportes y estadísticas</h1>
        <p className="text-sm text-slate-500">KPIs y tendencias de la plataforma</p>
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
          <h2 className="mb-4 font-semibold text-slate-900">Ventas por mes</h2>
          <BarChart data={reporte.ventasPorMes} />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Bonos más vendidos (año)</h2>
          <HorizontalBarList data={reporte.topBonos} />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Distribución por método de pago</h2>
          <DonutChart data={reporte.metodosPago} />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Detalle de KPIs</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Ventas del mes</dt>
              <dd className="font-semibold">{k.ventasMes}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Ventas del año</dt>
              <dd className="font-semibold">{k.ventasAnio}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Pendientes de pago</dt>
              <dd className="font-semibold text-amber-600">{k.ventasPendientes}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Bonos activos / inactivos</dt>
              <dd className="font-semibold">
                {k.bonosActivos} / {k.bonosInactivos}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}