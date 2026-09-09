"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { useCarrito } from "@/components/providers/CartProvider";
import { useToast } from "@/components/providers/ToastProvider";

type Bono = {
  _id: string;
  titulo: string;
  valor: number;
  imagen?: string;
  numeracion?: string | null;
};

export default function AddToCartButton({
  bono,
  agotado
}: {
  bono: Bono;
  agotado: boolean;
}) {
  const { agregar, abrir } = useCarrito();
  const { toast } = useToast();
  const router = useRouter();

  const handleAgregar = async () => {
    await agregar({
      bonoId: String(bono._id),
      cantidad: 1,
      titulo: bono.titulo,
      valor: bono.valor,
      imagen: bono.imagen,
      numeracion: bono.numeracion || null
    });
    toast("Bono agregado al carrito", "success");
    abrir();
  };

  const handleComprarAhora = async () => {
    await agregar({
      bonoId: String(bono._id),
      cantidad: 1,
      titulo: bono.titulo,
      valor: bono.valor,
      imagen: bono.imagen,
      numeracion: bono.numeracion || null
    });
    router.push("/carrito");
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={handleAgregar} disabled={agotado} className="btn-primary flex-1">
        <ShoppingCart className="h-4 w-4" />
        {agotado ? "Agotado" : "Agregar al carrito"}
      </button>
      {!agotado && (
        <button onClick={handleComprarAhora} className="btn-secondary flex-1">
          <Zap className="h-4 w-4 text-brand-600" />
          Comprar ahora
        </button>
      )}
    </div>
  );
}