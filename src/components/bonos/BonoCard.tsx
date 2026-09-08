"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, PackageX } from "lucide-react";
import { formatCurrency, formatDate, truncate } from "@/utils/helpers";
import { ESTADOS_BONO_LABEL } from "@/utils/constants";
import { useCarrito } from "@/components/providers/CartProvider";
import { useToast } from "@/components/providers/ToastProvider";

type Bono = {
  _id: string | { toString(): string };
  titulo: string;
  descripcion: string;
  valor: number;
  fechaEmision: string | Date;
  imagen?: string;
  estado: string;
  stock?: number | null;
};

const estadoStyles: Record<string, string> = {
  activo: "bg-brand-100 text-brand-800",
  inactivo: "bg-slate-100 text-slate-600",
  agotado: "bg-red-100 text-red-700"
};

export default function BonoCard({ bono }: { bono: Bono }) {
  const { agregar, abrir } = useCarrito();
  const { toast } = useToast();

  const agotado = bono.estado === "agotado" || (bono.stock != null && bono.stock <= 0);

  const handleAgregar = async () => {
    await agregar({
      bonoId: String(bono._id),
      cantidad: 1,
      titulo: bono.titulo,
      valor: bono.valor,
      imagen: bono.imagen,
      stock: bono.stock
    });
    toast("Bono agregado al carrito", "success");
    abrir();
  };

  return (
    <div className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/bonos/${bono._id}`} className="relative block h-36 overflow-hidden bg-slate-100">
        {bono.imagen ? (
          <Image
            src={bono.imagen}
            alt={bono.titulo}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-50">
            <PackageX className="h-10 w-10 text-brand-300" />
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${estadoStyles[bono.estado] || "bg-slate-100 text-slate-600"}`}
        >
          {ESTADOS_BONO_LABEL[bono.estado] || bono.estado}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/bonos/${bono._id}`}>
          <h3 className="text-base font-semibold text-slate-900 hover:text-brand-700">
            {bono.titulo}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {truncate(bono.descripcion, 100)}
        </p>
        <div className="mt-2 text-xs text-slate-400">
          Emisión: {formatDate(bono.fechaEmision)}
        </div>
        <div className="mt-4 flex items-end justify-between">
          <span className="text-xl font-bold text-brand-700">{formatCurrency(bono.valor)}</span>
        </div>
        <div className="mt-3">
          <button
            onClick={handleAgregar}
            disabled={agotado}
            className="btn-primary w-full"
          >
            <ShoppingCart className="h-4 w-4" />
            {agotado ? "Agotado" : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </div>
  );
}