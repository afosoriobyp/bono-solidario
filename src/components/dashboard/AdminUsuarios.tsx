"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, UserX } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { FullSpinner } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/providers/ToastProvider";
import { ROLES_LABEL } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";

type Usuario = {
  _id: string;
  nombre: string;
  email: string;
  rol: string;
  telefono?: string;
  activo: boolean;
  fechaCreacion: string;
};

const rolBadge: Record<string, "green" | "red" | "slate" | "amber"> = {
  admin: "red",
  vendedor: "amber",
  usuario: "green"
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [search, setSearch] = useState("");
  const [rolFiltro, setRolFiltro] = useState("todos");
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "usuario", telefono: "" });
  const { toast } = useToast();

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("rol", rolFiltro);
    try {
      const res = await fetch(`/api/admin/usuarios?${params.toString()}`);
      const data = await res.json();
      setUsuarios(data.users || []);
    } catch {
      setUsuarios([]);
    } finally {
      setCargando(false);
    }
  }, [search, rolFiltro]);

  useEffect(() => {
    const t = setTimeout(cargar, 300);
    return () => clearTimeout(t);
  }, [cargar]);

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (res.ok) {
      toast("Usuario creado", "success");
      setNuevoAbierto(false);
      setForm({ nombre: "", email: "", password: "", rol: "usuario", telefono: "" });
      cargar();
    } else {
      toast(data.error || "Error al crear", "error");
    }
  }

  async function cambiarRol(usuario: Usuario, rol: string) {
    const res = await fetch(`/api/admin/usuarios/${usuario._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol })
    });
    if (res.ok) {
      toast("Rol actualizado", "success");
      cargar();
    }
  }

  async function desactivar(usuario: Usuario) {
    const res = await fetch(`/api/admin/usuarios/${usuario._id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Usuario desactivado", "success");
      cargar();
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de usuarios</h1>
          <p className="text-sm text-slate-500">Administra cuentas y roles</p>
        </div>
        <button onClick={() => setNuevoAbierto(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="input pl-9"
          />
        </div>
        <select
          value={rolFiltro}
          onChange={(e) => setRolFiltro(e.target.value)}
          className="input w-auto"
        >
          <option value="todos">Todos los roles</option>
          <option value="admin">Administradores</option>
          <option value="vendedor">Vendedores</option>
          <option value="usuario">Usuarios</option>
        </select>
      </div>

      {cargando ? (
        <FullSpinner label="Cargando usuarios..." />
      ) : usuarios.length === 0 ? (
        <EmptyState titulo="No hay usuarios" descripcion="Crea un nuevo usuario o ajusta los filtros." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{u.nombre}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={rolBadge[u.rol] || "slate"}>{ROLES_LABEL[u.rol] || u.rol}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.telefono || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(u.fechaCreacion)}</td>
                  <td className="px-4 py-3">
                    <Badge color={u.activo ? "green" : "red"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <select
                        value={u.rol}
                        onChange={(e) => cambiarRol(u, e.target.value)}
                        className="input w-auto py-1 text-xs"
                      >
                        <option value="admin">Admin</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="usuario">Usuario</option>
                      </select>
                      <button
                        onClick={() => desactivar(u)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Desactivar"
                        title="Desactivar usuario"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        abierto={nuevoAbierto}
        onCerrar={() => setNuevoAbierto(false)}
        titulo="Crear usuario"
        footer={
          <>
            <button onClick={() => setNuevoAbierto(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" form="usuario-form" className="btn-primary">
              Crear
            </button>
          </>
        }
      >
        <form id="usuario-form" onSubmit={crearUsuario} className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contraseña</label>
              <input
                required
                minLength={6}
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Rol</label>
              <select
                value={form.rol}
                onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}
                className="input"
              >
                <option value="admin">Admin</option>
                <option value="vendedor">Vendedor</option>
                <option value="usuario">Usuario</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              value={form.telefono}
              onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
              className="input"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}