"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, User as UserIcon, Receipt, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { FullSpinner } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/providers/ToastProvider";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { ROLES_LABEL } from "@/utils/constants";

type Venta = {
  _id: string;
  ordenId: string;
  total: number;
  estado: string;
  metodoPago?: string;
  fechaVenta: string;
  bonos: { titulo?: string; cantidad: number; precioUnitario: number; bonoId?: any }[];
};

type Notificacion = {
  _id: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
};

const estadoBadge: Record<string, "green" | "red" | "slate" | "amber"> = {
  pendiente: "amber",
  pagado: "green",
  cancelado: "red"
};

const estadoLabel: Record<string, string> = {
  pendiente: "Pendiente de pago",
  pagado: "Pagado",
  cancelado: "Cancelado"
};

export default function UserPerfil({ user }: { user: { id?: string; name?: string | null; email?: string | null; rol?: string } }) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const { toast } = useToast();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [v, n] = await Promise.all([
        fetch("/api/mis-ventas").then((r) => r.json()),
        fetch("/api/notificaciones").then((r) => r.json())
      ]);
      setVentas(v.ventas || []);
      setNotificaciones(n.notificaciones || []);
    } catch {
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function marcarLeidas() {
    await fetch("/api/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todas: true })
    });
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    toast("Notificaciones marcadas como leídas", "success");
  }

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-slate-900">Mi cuenta</h1>
      <p className="mt-1 text-slate-500">Historial de compras, notificaciones y perfil</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Datos del usuario */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
                <UserIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Rol</span>
                <span className="font-medium">{ROLES_LABEL[user.rol || ""] || user.rol}</span>
              </div>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <Bell className="h-4 w-4 text-brand-600" />
                Notificaciones
                {noLeidas > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
                    {noLeidas}
                  </span>
                )}
              </h2>
              {noLeidas > 0 && (
                <button onClick={marcarLeidas} className="text-xs font-medium text-brand-700 hover:underline">
                  Marcar todas como leídas
                </button>
              )}
            </div>
            {notificaciones.length === 0 ? (
              <p className="text-sm text-slate-500">No tienes notificaciones.</p>
            ) : (
              <ul className="space-y-3">
                {notificaciones.slice(0, 5).map((n) => (
                  <li key={n._id} className={`rounded-lg border p-3 ${n.leida ? "border-slate-100 bg-white" : "border-brand-200 bg-brand-50"}`}>
                    <p className="text-sm font-medium text-slate-900">{n.titulo}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{n.mensaje}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatDate(n.fechaCreacion)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Historial de compras */}
        <div className="lg:col-span-2">
          {cargando ? (
            <FullSpinner label="Cargando tus compras..." />
          ) : ventas.length === 0 ? (
            <EmptyState
              titulo="Aún no tienes compras"
              descripcion="Explora nuestros bonos solidarios y haz tu primera compra."
              accion={<Link href="/bonos" className="btn-primary">Explorar bonos</Link>}
            />
          ) : (
            <div className="space-y-4">
              {ventas.map((venta) => (
                <div key={venta._id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Receipt className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{venta.ordenId}</p>
                        <p className="text-xs text-slate-500">{formatDate(venta.fechaVenta)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge color={estadoBadge[venta.estado] || "slate"}>
                        {estadoLabel[venta.estado] || venta.estado}
                      </Badge>
                      <span className="text-lg font-bold text-slate-900">{formatCurrency(venta.total)}</span>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1 border-t border-slate-100 pt-3">
                    {venta.bonos.map((b, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                          {b.cantidad} × {b.titulo || b.bonoId?.titulo || "Bono"}
                        </span>
                        <span className="font-medium text-slate-700">
                          {formatCurrency(b.precioUnitario * b.cantidad)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {venta.estado === "pendiente" && (
                    <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Tu compra está pendiente de verificación de pago.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}