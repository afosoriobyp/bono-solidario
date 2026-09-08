"use client";

import { useCallback, useEffect, useState } from "react";
import { Send, Bell, Mail, RefreshCw, CheckCircle2, Clock, XCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { FullSpinner } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/providers/ToastProvider";
import { formatDate } from "@/utils/helpers";

type Notificacion = {
  _id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  fechaCreacion: string;
  usuario?: { nombre?: string; email?: string } | string;
};

type StatsCola = {
  pendientes: number;
  enviados: number;
  errores: number;
  fallidos: number;
  enviadosHoy: number;
  limiteDiario: number;
};

export default function AdminNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [stats, setStats] = useState<StatsCola | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviarAbierto, setEnviarAbierto] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    mensaje: "",
    destino: "todos",
    rol: "usuario",
    enviarCorreo: false
  });
  const [enviando, setEnviando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const { toast } = useToast();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/admin/notificaciones");
      const data = await res.json();
      setNotificaciones(data.notificaciones || []);
      setStats(data.stats || null);
    } catch {
      setNotificaciones([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const body: Record<string, unknown> = {
      titulo: form.titulo,
      mensaje: form.mensaje,
      enviarCorreo: form.enviarCorreo
    };
    if (form.destino === "rol") body.rol = form.rol;

    try {
      const res = await fetch("/api/admin/notificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        toast(
          `Notificación enviada a ${data.enviadasA} destinatarios` +
            (data.emailsEncolados ? ` · ${data.emailsEncolados} correos en cola` : ""),
          "success"
        );
        setEnviarAbierto(false);
        setForm({ titulo: "", mensaje: "", destino: "todos", rol: "usuario", enviarCorreo: false });
        cargar();
      } else {
        toast(data.error || "Error al enviar", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setEnviando(false);
    }
  }

  async function procesarAhora() {
    setProcesando(true);
    try {
      const res = await fetch("/api/admin/emails/procesar", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast(
          `Cola procesada: ${data.enviados} enviados, ${data.errores} con error`,
          "success"
        );
        setStats(data.stats || null);
      } else {
        toast(data.error || "Error al procesar", "error");
      }
    } catch {
      toast("Error al procesar la cola", "error");
    } finally {
      setProcesando(false);
    }
  }

  const destinatario = (n: Notificacion) =>
    typeof n.usuario === "object" && n.usuario
      ? n.usuario.nombre || n.usuario.email
      : n.usuario || "Todos";

  const statsCards = [
    { label: "Pendientes", valor: stats?.pendientes ?? 0, icono: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Enviados hoy", valor: stats?.enviadosHoy ?? 0, icono: CheckCircle2, color: "text-brand-600 bg-brand-50" },
    { label: "Errores", valor: stats?.errores ?? 0, icono: XCircle, color: "text-red-600 bg-red-50" },
    { label: "Límite diario", valor: stats?.limiteDiario ?? 300, icono: Mail, color: "text-slate-600 bg-slate-100" }
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notificaciones</h1>
          <p className="text-sm text-slate-500">Historial, envío in-app y cola de correos</p>
        </div>
        <button onClick={() => setEnviarAbierto(true)} className="btn-primary">
          <Send className="h-4 w-4" />
          Enviar notificación
        </button>
      </div>

      {/* Stats de la cola de correos */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((s) => {
          const Icono = s.icono;
          return (
            <div key={s.label} className="card flex items-center gap-3 p-4">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                <Icono className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-900">{s.valor}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6 flex items-center justify-end">
        <button
          onClick={procesarAhora}
          disabled={procesando}
          className="btn-secondary"
        >
          <RefreshCw className={`h-4 w-4 ${procesando ? "animate-spin" : ""}`} />
          {procesando ? "Procesando..." : "Procesar cola ahora"}
        </button>
      </div>

      {cargando ? (
        <FullSpinner label="Cargando notificaciones..." />
      ) : notificaciones.length === 0 ? (
        <EmptyState titulo="Sin notificaciones" descripcion="Envía la primera notificación a tus usuarios." />
      ) : (
        <div className="space-y-3">
          {notificaciones.map((n) => (
            <div key={n._id} className="card flex items-start gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Bell className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{n.titulo}</h3>
                  <span className="text-xs text-slate-400">{formatDate(n.fechaCreacion)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{n.mensaje}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge color="slate">{destinatario(n)}</Badge>
                  {n.leida ? (
                    <Badge color="green">Leída</Badge>
                  ) : (
                    <Badge color="amber">Pendiente</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        abierto={enviarAbierto}
        onCerrar={() => setEnviarAbierto(false)}
        titulo="Enviar notificación"
        footer={
          <>
            <button onClick={() => setEnviarAbierto(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" form="notif-form" disabled={enviando} className="btn-primary">
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </>
        }
      >
        <form id="notif-form" onSubmit={enviar} className="space-y-4">
          <div>
            <label className="label">Título</label>
            <input
              required
              value={form.titulo}
              onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              className="input"
              placeholder="¡Nuevo bono disponible!"
            />
          </div>
          <div>
            <label className="label">Mensaje</label>
            <textarea
              required
              rows={3}
              value={form.mensaje}
              onChange={(e) => setForm((p) => ({ ...p, mensaje: e.target.value }))}
              className="input resize-none"
            />
          </div>
          <div>
            <label className="label">Destino</label>
            <select
              value={form.destino}
              onChange={(e) => setForm((p) => ({ ...p, destino: e.target.value }))}
              className="input"
            >
              <option value="todos">Todos los usuarios</option>
              <option value="rol">Por rol</option>
            </select>
          </div>
          {form.destino === "rol" && (
            <div>
              <label className="label">Rol</label>
              <select
                value={form.rol}
                onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}
                className="input"
              >
                <option value="usuario">Usuarios</option>
                <option value="vendedor">Vendedores</option>
                <option value="admin">Administradores</option>
              </select>
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={form.enviarCorreo}
              onChange={(e) => setForm((p) => ({ ...p, enviarCorreo: e.target.checked }))}
              className="h-4 w-4 accent-brand-600"
            />
            <span className="text-sm font-medium text-slate-800">Enviar también por correo</span>
          </label>
          {form.enviarCorreo && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
              Se agregará un correo a la cola por cada destinatario. El envío masivo respeta el
              límite diario ({stats?.limiteDiario ?? 300} correos) y se despacha en segundo plano.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}