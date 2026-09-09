"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCarrito } from "@/components/providers/CartProvider";
import { formatCurrency } from "@/utils/helpers";

export default function CartSidebar() {
  const { abierto, cerrar, items, subtotal, actualizarCantidad, eliminar } = useCarrito();

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={cerrar}
        aria-hidden
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <ShoppingBag className="h-5 w-5 text-brand-600" />
            Tu carrito
          </h2>
          <button onClick={cerrar} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-slate-300" />
            <p className="font-medium text-slate-700">Tu carrito está vacío</p>
            <p className="text-sm text-slate-500">Explora nuestros bonos solidarios.</p>
            <Link href="/bonos" onClick={cerrar} className="btn-primary mt-2">
              Ver bonos
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.bonoId} className="flex gap-3">
                    {item.imagen ? (
                      <Image
                        src={item.imagen}
                        alt={item.titulo || ""}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{item.titulo}</p>
                        <button
                          onClick={() => eliminar(item.bonoId)}
                          className="text-slate-400 hover:text-red-600"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-500">{formatCurrency(item.valor || 0)}</p>
                      <div className="mt-2 flex items-center justify-between">
                        {item.numeracion ? (
                          <span className="text-xs text-slate-500">
                            {item.numeros && item.numeros.length > 0
                              ? `Números: ${item.numeros.join(", ")}`
                              : "Números: por elegir"}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => actualizarCantidad(item.bonoId, item.cantidad - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 hover:bg-slate-100"
                              aria-label="Disminuir"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">{item.cantidad}</span>
                            <button
                              onClick={() => actualizarCantidad(item.bonoId, item.cantidad + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 hover:bg-slate-100"
                              aria-label="Aumentar"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(
                            (item.valor || 0) *
                              (item.numeracion
                                ? (item.numeros || []).length
                                : item.cantidad)
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-200 px-5 py-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-600">Subtotal</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <Link href="/carrito" onClick={cerrar} className="btn-primary w-full">
                Proceder al pago
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button onClick={cerrar} className="btn-secondary mt-2 w-full">
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}