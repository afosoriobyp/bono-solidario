import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, PackageX, ShieldCheck, ShoppingCart, ArrowLeft, Hash } from "lucide-react";
import { obtenerBono } from "@/services/bonoService";
import { formatCurrency, formatDate, NUMERACION_LABEL } from "@/utils/helpers";
import { ESTADOS_BONO_LABEL } from "@/utils/constants";
import AddToCartButton from "@/components/bonos/AddToCartButton";

export const dynamic = "force-dynamic";

export default async function BonoDetallePage({
  params
}: {
  params: { id: string };
}) {
  const bono = await obtenerBono(params.id);
  if (!bono) notFound();
  if (bono.estado !== "activo") notFound();

  // Tras el guard anterior el estado es "activo"; solo el stock determina agotado
  const agotado = bono.stock != null && bono.stock <= 0;

  return (
    <div className="container-page py-10">
      <Link href="/bonos" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" />
        Volver a bonos
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative h-56 overflow-hidden rounded-xl bg-slate-100 sm:h-64 lg:h-80">
          {bono.imagen ? (
            <Image
              src={bono.imagen}
              alt={bono.titulo}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-brand-50">
              <PackageX className="h-16 w-16 text-brand-300" />
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
              {ESTADOS_BONO_LABEL[bono.estado] || bono.estado}
            </span>
            {agotado && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                Agotado
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-slate-900">{bono.titulo}</h1>

          <p className="mt-4 text-lg text-brand-700">{formatCurrency(bono.valor)}</p>

          <p className="mt-4 whitespace-pre-line text-slate-600">{bono.descripcion}</p>

          <div className="mt-6 space-y-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-600" />
              Fecha de emisión: {formatDate(bono.fechaEmision)}
            </div>
            {bono.fechaVencimiento && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-600" />
                Fecha de vencimiento: {formatDate(bono.fechaVencimiento)}
              </div>
            )}
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              Disponibilidad: {bono.stock != null ? `${bono.stock} unidades` : "Ilimitado"}
            </div>
            {bono.numeracion && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-brand-600" />
                Numeración: {NUMERACION_LABEL[bono.numeracion] || bono.numeracion}
              </div>
            )}
          </div>

          <div className="mt-6">
            <AddToCartButton
              bono={{
                _id: String(bono._id),
                titulo: bono.titulo,
                valor: bono.valor,
                imagen: bono.imagen,
                numeracion: bono.numeracion || null
              }}
              agotado={agotado}
            />
          </div>
        </div>
      </div>
    </div>
  );
}