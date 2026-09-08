"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, CheckCircle2, Send, ArrowRight } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { Spinner } from "@/components/ui/Spinner";

type PasoComprobanteProps = {
  ventaId: string;
  ordenId: string;
  datosBanco: Record<string, string>;
  onCompletado: () => void;
};

export default function PasoComprobante({
  ventaId,
  ordenId,
  datosBanco,
  onCompletado
}: PasoComprobanteProps) {
  const { toast } = useToast();
  const [comprobante, setComprobante] = useState<{ url: string; nombre: string } | null>(null);
  const [referencia, setReferencia] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function subirArchivo(file: File) {
    setSubiendo(true);
    const form = new FormData();
    form.append("file", file);
    form.append("carpeta", "comprobantes");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        setComprobante({ url: data.url, nombre: file.name });
        toast("Comprobante subido", "success");
      } else {
        toast(data.error || "Error al subir", "error");
      }
    } catch {
      toast("Error al subir el archivo", "error");
    } finally {
      setSubiendo(false);
    }
  }

  async function enviarComprobante() {
    if (!comprobante) {
      toast("Adjunta el comprobante antes de continuar", "info");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`/api/ventas/${ventaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comprobantePago: comprobante.url,
          referencia: referencia || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast("Comprobante enviado. ¡Gracias!", "success");
        onCompletado();
      } else {
        toast(data.error || "No se pudo enviar el comprobante", "error");
      }
    } catch {
      toast("Error al enviar el comprobante", "error");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        {/* Indicador de paso */}
        <div className="mb-8 flex items-center gap-2 text-sm">
          <span className="rounded-full bg-brand-100 px-3 py-1 font-medium text-brand-800">
            1 · Método de pago
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <span className="rounded-full bg-brand-600 px-3 py-1 font-medium text-white">
            2 · Comprobante de pago
          </span>
        </div>

        <div className="card p-6 sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Upload className="h-6 w-6 text-brand-600" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Adjunta tu comprobante</h1>
          <p className="mt-2 text-slate-600">
            Ya registramos tu orden{" "}
            <strong className="text-brand-700">{ordenId}</strong>. Ahora envía el soporte del pago
            para que podamos verificar tu transferencia.
          </p>

          {/* Datos bancarios */}
          <div className="mt-6 rounded-lg border border-brand-100 bg-brand-50 p-4">
            <h2 className="text-sm font-semibold text-brand-900">Datos para la transferencia</h2>
            <dl className="mt-2 space-y-1 text-sm text-slate-700">
              <div className="flex justify-between">
                <dt className="text-slate-500">Banco:</dt>
                <dd>{datosBanco.nombre || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Cuenta:</dt>
                <dd>{datosBanco.numeroCuenta || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tipo:</dt>
                <dd>{datosBanco.tipoCuenta || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Titular:</dt>
                <dd>{datosBanco.titular || "—"}</dd>
              </div>
            </dl>
          </div>

          {/* Upload */}
          <div className="mt-6">
            <label className="label">Comprobante de pago (imagen/PDF)</label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500 transition-colors hover:border-brand-500 hover:text-brand-600">
              <Upload className="h-7 w-7" />
              {subiendo
                ? "Subiendo..."
                : comprobante
                ? comprobante.nombre
                : "Haz clic para subir tu comprobante"}
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && subirArchivo(e.target.files[0])}
              />
            </label>
            {comprobante && (
              <p className="mt-2 flex items-center gap-1 text-xs text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Comprobante cargado correctamente.
              </p>
            )}
          </div>

          <div className="mt-4">
            <label className="label">Número de referencia (opcional)</label>
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: 1234567890"
              className="input"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={enviarComprobante}
              disabled={subiendo || enviando}
              className="btn-primary flex-1"
            >
              {enviando ? <Spinner size={18} /> : <Send className="h-4 w-4" />}
              Enviar comprobante
            </button>
            <button onClick={onCompletado} className="btn-secondary flex-1" disabled={subiendo || enviando}>
              Enviar después
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            Puedes enviar el comprobante más tarde desde tu perfil en {`"Mis compras"`}.
          </p>
        </div>
      </div>
    </div>
  );
}