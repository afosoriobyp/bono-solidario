"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Upload, Loader2 } from "lucide-react";

type BonoFormProps = {
  bono?: {
    _id: string;
    titulo: string;
    descripcion: string;
    valor: number;
    fechaEmision: string;
    fechaVencimiento?: string | null;
    imagen?: string;
    estado: string;
    stock?: number | null;
  } | null;
  onSubmit: (data: Record<string, unknown>) => void;
};

export default function BonoForm({ bono, onSubmit }: BonoFormProps) {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    valor: "",
    fechaEmision: "",
    fechaVencimiento: "",
    imagen: "",
    estado: "activo",
    stock: ""
  });
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    if (bono) {
      setForm({
        titulo: bono.titulo,
        descripcion: bono.descripcion,
        valor: String(bono.valor),
        fechaEmision: bono.fechaEmision?.slice(0, 10) || "",
        fechaVencimiento: bono.fechaVencimiento?.slice(0, 10) || "",
        imagen: bono.imagen || "",
        estado: bono.estado === "agotado" ? "inactivo" : bono.estado,
        stock: bono.stock != null ? String(bono.stock) : ""
      });
    } else {
      const hoy = new Date().toISOString().slice(0, 10);
      setForm({
        titulo: "",
        descripcion: "",
        valor: "",
        fechaEmision: hoy,
        fechaVencimiento: "",
        imagen: "",
        estado: "activo",
        stock: ""
      });
    }
  }, [bono]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function subirImagen(file: File) {
    setSubiendo(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("carpeta", "bonos");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        update("imagen", data.url);
      } else {
        alert(data.error || "Error al subir la imagen");
      }
    } catch {
      alert("Error al subir la imagen");
    } finally {
      setSubiendo(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      titulo: form.titulo,
      descripcion: form.descripcion,
      valor: Number(form.valor),
      fechaEmision: form.fechaEmision,
      fechaVencimiento: form.fechaVencimiento || null,
      imagen: form.imagen || null,
      estado: form.estado,
      stock: form.stock === "" ? null : Number(form.stock)
    });
  }

  return (
    <form id="bono-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Título *</label>
        <input
          required
          minLength={3}
          value={form.titulo}
          onChange={(e) => update("titulo", e.target.value)}
          className="input"
          placeholder="Bono Solidario Navidad 2025"
        />
      </div>

      <div>
        <label className="label">Descripción *</label>
        <textarea
          required
          minLength={10}
          rows={4}
          value={form.descripcion}
          onChange={(e) => update("descripcion", e.target.value)}
          className="input resize-none"
          placeholder="Describe el propósito y detalle del bono..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Valor *</label>
          <input
            required
            type="number"
            min={1}
            value={form.valor}
            onChange={(e) => update("valor", e.target.value)}
            className="input"
            placeholder="50000"
          />
        </div>
        <div>
          <label className="label">Stock (vacío = ilimitado)</label>
          <input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => update("stock", e.target.value)}
            className="input"
            placeholder="Ilimitado"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Fecha de emisión *</label>
          <input
            required
            type="date"
            value={form.fechaEmision}
            onChange={(e) => update("fechaEmision", e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Fecha de vencimiento</label>
          <input
            type="date"
            value={form.fechaVencimiento}
            onChange={(e) => update("fechaVencimiento", e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">Imagen del bono</label>

        {/* Preview */}
        {form.imagen && (
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Image
              src={form.imagen}
              alt="Preview"
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg object-cover"
            />
            <p className="truncate text-xs text-slate-500">{form.imagen}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="btn-secondary cursor-pointer">
            {subiendo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {subiendo ? "Subiendo..." : "Subir imagen"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={subiendo}
              onChange={(e) => e.target.files?.[0] && subirImagen(e.target.files[0])}
            />
          </label>
          <input
            value={form.imagen}
            onChange={(e) => update("imagen", e.target.value)}
            className="input flex-1"
            placeholder="o pega una URL https://..."
          />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Sube la imagen (máx. 5MB, JPG/PNG/WEBP) o usa una URL pública. Si no se define, se
          mostrará un placeholder.
        </p>
      </div>

      <div>
        <label className="label">Estado</label>
        <select
          value={form.estado}
          onChange={(e) => update("estado", e.target.value)}
          className="input"
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>
    </form>
  );
}