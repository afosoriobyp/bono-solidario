"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { FullSpinner } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/providers/ToastProvider";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { classNames } from "@/utils/helpers";

type Venta = {
  _id: string;
  ordenId: string;
  total: number;
  estado: string;
  metodoPago?: string;
  fechaVenta: string;
  usuario?: { nombre?: string; email?: string } | string;
  bonos: { titulo?: string; cantidad: number; precioUnitario: number; bonoId?: any }[];
};

const estadoBadge: Record<string, "green" | "red" | "slate" | "amber"> = {
  pendiente: "amber",
  pagado: "green",
  cancelado: "red"
};

const metodoLabel: Record<string, string> = {
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  efectivo: "Efectivo"
};

const LIMIT = 10;

export default function VentasTable({
  endpoint,
  admin = false
}: {
  endpoint: string;
  admin?: boolean;
}) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({
        estado: estadoFiltro,
        page: String(page),
        limit: String(LIMIT)
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`${endpoint}?${params.toString()}`);
      const data = await res.json();
      setVentas(data.ventas || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setVentas([]);
    } finally {
      setCargando(false);
    }
  }, [endpoint, estadoFiltro, search, page]);

  useEffect(() => {
    const t = setTimeout(cargar, 350);
    return () => clearTimeout(t);
  }, [cargar]);

  async function cambiarEstado(venta: Venta, estado: string) {
    const res = await fetch(`/api/admin/ventas?id=${venta._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado })
    });
    if (res.ok) {
      toast("Estado actualizado", "success");
      cargar();
    } else {
      const data = await res.json();
      toast(data.error || "Error al actualizar", "error");
    }
  }

  const nombreUsuario = (v: Venta) =>
    typeof v.usuario === "object" && v.usuario ? v.usuario.nombre || v.usuario.email : "Cliente";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ventas</h1>
          <p className="text-sm text-slate-500">Historial de ventas</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por orden, cliente o bono..."
              className="input w-72 pl-9"
            />
          </div>
          <select
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value);
              setPage(1);
            }}
            className="input w-auto"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="pagado">Pagadas</option>
            <option value="cancelado">Canceladas</option>
          </select>
        </div>
      </div>

      {cargando ? (
        <FullSpinner label="Cargando ventas..." />
      ) : ventas.length === 0 ? (
        <EmptyState
          titulo="No hay ventas"
          descripcion="Las ventas registradas aparecerán aquí."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-5 py-3">Orden</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Bonos</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Método</th>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Estado</th>
                {admin && <th className="px-5 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ventas.map((venta) => (
                <tr key={venta._id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{venta.ordenId}</td>
                  <td className="px-5 py-3.5 text-slate-600">{nombreUsuario(venta)}</td>
                  <td className="px-5 py-3.5">
                    <ul className="max-w-[260px] space-y-0.5">
                      {venta.bonos.map((b, i) => (
                        <li key={i} className="truncate text-slate-600">
                          {b.cantidad} × {b.titulo || b.bonoId?.titulo || "Bono"}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {formatCurrency(venta.total)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {metodoLabel[venta.metodoPago || ""] || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{formatDate(venta.fechaVenta)}</td>
                  <td className="px-5 py-3.5">
                    <Badge color={estadoBadge[venta.estado] || "slate"}>{venta.estado}</Badge>
                  </td>
                  {admin && (
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => cambiarEstado(venta, "pagado")}
                          className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                        >
                          Marcar pagado
                        </button>
                        <button
                          onClick={() => cambiarEstado(venta, "cancelado")}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
            <p className="text-sm text-slate-500">
              Página <span className="font-medium text-slate-700">{page}</span> de{" "}
              <span className="font-medium text-slate-700">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || cargando}
                className={classNames(
                  "btn-secondary px-3 py-1.5 text-sm",
                  page <= 1 && "pointer-events-none opacity-40"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || cargando}
                className={classNames(
                  "btn-secondary px-3 py-1.5 text-sm",
                  page >= totalPages && "pointer-events-none opacity-40"
                )}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}