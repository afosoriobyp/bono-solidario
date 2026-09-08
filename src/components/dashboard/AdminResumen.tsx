"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Ticket,
  Users,
  Clock,
  BadgeCheck,
  BadgeMinus,
  Receipt,
  Bell
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

export default function AdminResumen() {
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de administración</h1>
          <p className="text-sm text-slate-500">Indicadores generales de la plataforma</p>
        </div>
        <Link href="/admin/bonos" className="btn-primary">
          Nuevo bono
        </Link>
      </div>

      {/* KPIs */}
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

      {/* Gráficos */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <TrendingUp className="h-4 w-4 text-brand-600" />
            Ventas por mes (últimos 6 meses)
          </h2>
          <BarChart data={reporte.ventasPorMes} />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <Ticket className="h-4 w-4 text-brand-600" />
            Bonos más vendidos del año
          </h2>
          <HorizontalBarList data={reporte.topBonos} />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-brand-600" />
            Método de pago (año)
          </h2>
          <DonutChart data={reporte.metodosPago} />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Accesos rápidos</h2>
          <div className="grid gap-3">
            <Link href="/admin/bonos" className="btn-secondary">Gestionar bonos</Link>
            <Link href="/admin/ventas" className="btn-secondary">Ver ventas</Link>
            <Link href="/admin/usuarios" className="btn-secondary">Gestionar usuarios</Link>
            <Link href="/admin/notificaciones" className="btn-secondary">Enviar notificación</Link>
          </div>
        </div>
      </div>
    </div>
  );
}