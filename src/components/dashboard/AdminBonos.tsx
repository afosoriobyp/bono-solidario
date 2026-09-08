"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, Plus, Search, PackageX } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { FullSpinner } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import BonoForm from "@/components/dashboard/BonoForm";
import { useToast } from "@/components/providers/ToastProvider";
import { formatCurrency, formatDate } from "@/utils/helpers";

type Bono = {
  _id: string;
  titulo: string;
  descripcion: string;
  valor: number;
  fechaEmision: string;
  fechaVencimiento?: string | null;
  imagen?: string;
  estado: string;
  stock?: number | null;
};

const badgeColor: Record<string, "green" | "red" | "slate" | "amber"> = {
  activo: "green",
  inactivo: "slate",
  agotado: "red"
};

export default function AdminBonos({ rol }: { rol?: string }) {
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [cargando, setCargando] = useState(true);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Bono | null>(null);
  const [eliminando, setEliminando] = useState<Bono | null>(null);
  const [guardando, setGuardando] = useState(false);
  const { toast } = useToast();

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("estado", estadoFiltro);
    params.set("limit", "100");
    try {
      const res = await fetch(`/api/admin/bonos?${params.toString()}`);
      const data = await res.json();
      setBonos(data.bonos || []);
    } catch {
      setBonos([]);
    } finally {
      setCargando(false);
    }
  }, [search, estadoFiltro]);

  useEffect(() => {
    const t = setTimeout(cargar, 300);
    return () => clearTimeout(t);
  }, [cargar]);

  async function guardarBono(data: Record<string, unknown>) {
    setGuardando(true);
    try {
      const url = editando ? `/api/admin/bonos/${editando._id}` : "/api/admin/bonos";
      const res = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const resp = await res.json();
      if (!res.ok) {
        toast(resp.error || "Error al guardar", "error");
        return;
      }
      toast(editando ? "Bono actualizado" : "Bono creado", "success");
      setFormAbierto(false);
      setEditando(null);
      cargar();
    } catch {
      toast("Error al guardar el bono", "error");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    if (!eliminando) return;
    const res = await fetch(`/api/admin/bonos/${eliminando._id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Bono eliminado", "success");
      cargar();
    } else {
      const data = await res.json();
      toast(data.error || "No se pudo eliminar", "error");
    }
    setEliminando(null);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de bonos</h1>
          <p className="text-sm text-slate-500">
            {rol === "admin" ? "Administra todos los bonos de la plataforma" : "Administra tus propios bonos"}
          </p>
        </div>
        <button
          onClick={() => {
            setEditando(null);
            setFormAbierto(true);
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Nuevo bono
        </button>
      </div>

      {/* Filtros */}
      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar bonos..."
            className="input pl-9"
          />
        </div>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="input w-auto"
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
          <option value="agotado">Agotados</option>
        </select>
      </div>

      {cargando ? (
        <FullSpinner label="Cargando bonos..." />
      ) : bonos.length === 0 ? (
        <EmptyState
          titulo="No hay bonos"
          descripcion="Crea tu primer bono solidario."
          accion={
            <button
              onClick={() => {
                setEditando(null);
                setFormAbierto(true);
              }}
              className="btn-primary"
            >
              Crear bono
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Bono</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Emisión</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bonos.map((bono) => (
                <tr key={bono._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {bono.imagen ? (
                        <Image
                          src={bono.imagen}
                          alt={bono.titulo}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                          <PackageX className="h-5 w-5" />
                        </span>
                      )}
                      <span className="font-medium text-slate-800">{bono.titulo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(bono.valor)}</td>
                  <td className="px-4 py-3">
                    <Badge color={badgeColor[bono.estado] || "slate"}>{bono.estado}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {bono.stock != null ? bono.stock : "∞"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(bono.fechaEmision)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditando(bono);
                          setFormAbierto(true);
                        }}
                        className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-700"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEliminando(bono)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal formulario */}
      <Modal
        abierto={formAbierto}
        onCerrar={() => {
          setFormAbierto(false);
          setEditando(null);
        }}
        titulo={editando ? "Editar bono" : "Crear bono"}
        footer={
          <>
            <button onClick={() => setFormAbierto(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              form="bono-form"
              disabled={guardando}
              className="btn-primary"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </>
        }
      >
        <BonoForm
          bono={editando}
          onSubmit={guardarBono}
        />
      </Modal>

      {/* Modal eliminar */}
      <Modal
        abierto={!!eliminando}
        onCerrar={() => setEliminando(null)}
        titulo="Eliminar bono"
        footer={
          <>
            <button onClick={() => setEliminando(null)} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={confirmarEliminar} className="btn-danger">
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de que deseas eliminar <strong>{eliminando?.titulo}</strong>? El bono pasará a
          estado inactivo.
        </p>
      </Modal>
    </div>
  );
}