"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCheck,
  FileText,
  ExternalLink
} from "lucide-react";
import { FullSpinner } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
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
  comprobantePago?: string;
  usuario?: { nombre?: string; email?: string } | string;
  datosComprador?: { nombre?: string; email?: string; telefono?: string };
  bonos: { titulo?: string; cantidad: number; precioUnitario: number; bonoId?: any }[];
};

type VentaDetalle = Venta & {
  datosTransferencia?: {
    banco?: string;
    numeroCuenta?: string;
    titular?: string;
    referencia?: string;
  };
  fechaPago?: string | null;
};

const estadoBadge: Record<string, "green" | "red" | "slate" | "amber"> = {
  pendiente: "amber",
  pagado: "green",
  cancelado: "red"
};

const estadoLabel: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado"
};

const metodoLabel: Record<string, string> = {
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  efectivo: "Efectivo"
};

const LIMIT = 10;

function esPdf(url?: string): boolean {
  return url?.toLowerCase().endsWith(".pdf") ?? false;
}

export default function VentasTable({ endpoint }: { endpoint: string }) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detalle, setDetalle] = useState<VentaDetalle | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
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

  async function abrirDetalle(venta: Venta) {
    setDetalle(null);
    setCargandoDetalle(true);
    try {
      const res = await fetch(`/api/ventas/${venta._id}`);
      const data = await res.json();
      if (res.ok) {
        setDetalle(data.venta);
      } else {
        toast(data.error || "No se pudo cargar el detalle", "error");
      }
    } catch {
      toast("Error al cargar el detalle", "error");
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function cambiarEstado(venta: Venta, estado: string) {
    const res = await fetch(`/api/admin/ventas?id=${venta._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado })
    });
    if (res.ok) {
      toast("Estado actualizado", "success");
      cargar();
      if (detalle && detalle._id === venta._id) {
        setDetalle((prev) => (prev ? { ...prev, estado } : prev));
      }
    } else {
      const data = await res.json();
      toast(data.error || "Error al actualizar", "error");
    }
  }

  const nombreUsuario = (v: Venta) => {
    if (v.datosComprador?.nombre) return v.datosComprador.nombre;
    return typeof v.usuario === "object" && v.usuario
      ? v.usuario.nombre || v.usuario.email
      : "Cliente";
  };

  const emailUsuario = (v: Venta) => {
    if (v.datosComprador?.email) return v.datosComprador.email;
    return typeof v.usuario === "object" && v.usuario ? v.usuario.email : "";
  };

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
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-5 py-3">Orden</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Bonos</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Método</th>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ventas.map((venta) => (
                <tr key={venta._id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{venta.ordenId}</td>
                  <td className="px-5 py-3.5 text-slate-600">{nombreUsuario(venta)}</td>
                  <td className="px-5 py-3.5">
                    <ul className="max-w-[240px] space-y-0.5">
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
                    <Badge color={estadoBadge[venta.estado] || "slate"}>
                      {estadoLabel[venta.estado] || venta.estado}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {venta.comprobantePago && (
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-600"
                          title="Comprobante adjunto"
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <button
                        onClick={() => abrirDetalle(venta)}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </button>
                    </div>
                  </td>
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

      {/* Modal detalle de la venta */}
      <Modal
        abierto={!!detalle || cargandoDetalle}
        onCerrar={() => setDetalle(null)}
        titulo={detalle ? `Detalle · ${detalle.ordenId}` : "Cargando..."}
        footer={
          detalle && (
            <>
              <button onClick={() => setDetalle(null)} className="btn-secondary">
                Cerrar
              </button>
              {detalle.estado !== "pagado" && (
                <button
                  onClick={() => cambiarEstado(detalle, "pagado")}
                  className="btn-primary"
                >
                  Marcar pagado
                </button>
              )}
              {detalle.estado !== "cancelado" && detalle.estado !== "pagado" && (
                <button
                  onClick={() => cambiarEstado(detalle, "cancelado")}
                  className="btn-danger"
                >
                  Cancelar venta
                </button>
              )}
            </>
          )
        }
      >
        {cargandoDetalle ? (
          <FullSpinner label="Cargando detalle..." />
        ) : detalle ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-slate-500">Orden</p>
                <p className="font-semibold text-slate-900">{detalle.ordenId}</p>
              </div>
              <Badge color={estadoBadge[detalle.estado] || "slate"}>
                {estadoLabel[detalle.estado] || detalle.estado}
              </Badge>
            </div>

            {/* Comprador */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Comprador</h3>
              <dl className="mt-2 space-y-1 text-sm text-slate-700">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Nombre:</dt>
                  <dd>{detalle.datosComprador?.nombre || (typeof detalle.usuario === "object" ? detalle.usuario?.nombre : "") || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Email:</dt>
                  <dd>{detalle.datosComprador?.email || (typeof detalle.usuario === "object" ? detalle.usuario?.email : "") || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Teléfono:</dt>
                  <dd>{detalle.datosComprador?.telefono || "—"}</dd>
                </div>
              </dl>
            </div>

            {/* Items */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Bonos</h3>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
                {detalle.bonos.map((b, i) => (
                  <li key={i} className="flex items-center justify-between px-3 py-2">
                    <span className="text-slate-600">
                      {b.cantidad} × {b.titulo || b.bonoId?.titulo || "Bono"}
                    </span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(b.precioUnitario * b.cantidad)}
                    </span>
                  </li>
                ))}
                <li className="flex items-center justify-between bg-slate-50 px-3 py-2 font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(detalle.total)}</span>
                </li>
              </ul>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Método de pago</dt>
                <dd className="font-medium text-slate-800">
                  {metodoLabel[detalle.metodoPago || ""] || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Fecha</dt>
                <dd className="font-medium text-slate-800">{formatDate(detalle.fechaVenta)}</dd>
              </div>
              {detalle.datosTransferencia?.referencia && (
                <div>
                  <dt className="text-slate-500">Referencia</dt>
                  <dd className="font-medium text-slate-800">
                    {detalle.datosTransferencia.referencia}
                  </dd>
                </div>
              )}
            </dl>

            {/* Comprobante */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Comprobante de pago</h3>
              {detalle.comprobantePago ? (
                esPdf(detalle.comprobantePago) ? (
                  <a
                    href={detalle.comprobantePago}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <FileText className="h-4 w-4" />
                    Ver PDF del comprobante
                  </a>
                ) : (
                  <div className="relative h-64 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    <Image
                      src={detalle.comprobantePago}
                      alt="Comprobante de pago"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                    <a
                      href={detalle.comprobantePago}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-2 btn-secondary px-3 py-1.5 text-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir
                    </a>
                  </div>
                )
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  El comprador aún no ha adjuntado el comprobante.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}