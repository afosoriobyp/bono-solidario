"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import {
  Trash2,
  Minus,
  Plus,
  Building2,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { useCarrito } from "@/components/providers/CartProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Spinner } from "@/components/ui/Spinner";
import PasoComprobante from "@/components/carrito/PasoComprobante";
import { formatCurrency } from "@/utils/helpers";

type VentaPendiente = { id: string; ordenId: string; metodoPago: string };

const STORAGE_KEY = "ventaPendiente";

export default function CarritoPage() {
  const { items, subtotal, actualizarCantidad, eliminar, vaciar } = useCarrito();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  // "Efectivo" solo disponible para admin y vendedor (los usuarios no lo ven)
  const esStaff =
    session?.user?.rol === "admin" || session?.user?.rol === "vendedor";

  const metodosPago = [
    { id: "transferencia", icono: Building2, label: "Transferencia bancaria" },
    { id: "tarjeta", icono: CreditCard, label: "Tarjeta de crédito/débito" }
  ];
  if (esStaff) {
    metodosPago.push({ id: "efectivo", icono: Banknote, label: "Efectivo (punto de venta)" });
  }

  const [metodoPago, setMetodoPago] = useState("transferencia");
  const [confirmando, setConfirmando] = useState(false);
  const [datosBanco, setDatosBanco] = useState<Record<string, string>>({});
  const [ventaPendiente, setVentaPendiente] = useState<VentaPendiente | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => setDatosBanco(data.config?.banco || {}))
      .catch(() => {});
  }, []);

  // Restaurar venta pendiente (si el usuario recarga entre pasos)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const pendiente = JSON.parse(raw) as VentaPendiente;
        if (pendiente?.id && pendiente?.ordenId) {
          setVentaPendiente(pendiente);
          setMetodoPago(pendiente.metodoPago || "transferencia");
        }
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Si el usuario tiene items en el carrito, inicia una nueva compra:
  // se limpia cualquier venta pendiente previa para no bloquear el formulario.
  useEffect(() => {
    if (items.length > 0 && ventaPendiente) {
      setVentaPendiente(null);
      setExito(false);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [items.length, ventaPendiente]);

  async function confirmarCompra() {
    if (items.length === 0) return;
    if (status !== "authenticated") {
      toast("Debes iniciar sesión para confirmar", "info");
      router.push("/login");
      return;
    }

    setConfirmando(true);
    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ bonoId: i.bonoId, cantidad: i.cantidad })),
          metodoPago
        })
      });

      const data = await res.json();
      if (res.ok) {
        await vaciar();
        const pendiente: VentaPendiente = {
          id: data.venta._id,
          ordenId: data.venta.ordenId,
          metodoPago
        };
        setVentaPendiente(pendiente);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pendiente));
        toast("¡Compra registrada!", "success");
      } else {
        toast(data.error || "No se pudo procesar la compra", "error");
      }
    } catch {
      toast("Error al procesar la compra", "error");
    } finally {
      setConfirmando(false);
    }
  }

  function finalizarPasoComprobante() {
    setExito(true);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  // Si el carrito tiene items, siempre se muestra el formulario (nueva compra)
  const hayItems = items.length > 0;

  // Éxito final
  if (!hayItems && (exito || (ventaPendiente && ventaPendiente.metodoPago !== "transferencia"))) {
    const ordenId = ventaPendiente?.ordenId;
    return (
      <div className="container-page flex flex-col items-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
          <CheckCircle2 className="h-9 w-9 text-brand-600" />
        </span>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">¡Compra registrada!</h1>
        <p className="mt-3 max-w-md text-slate-600">
          {ordenId && (
            <>
              Tu orden <strong className="text-brand-700">{ordenId}</strong> fue creada.{" "}
            </>
          )}
          Te enviamos un correo con el detalle. Una vez verifiquemos el pago, quedará confirmada.
        </p>
        {ventaPendiente?.metodoPago === "efectivo" && (
          <p className="mt-3 max-w-md rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Pagaste en efectivo en nuestro punto de venta. La dirección y horario te serán enviados
            por correo.
          </p>
        )}
        <div className="mt-8 flex gap-3">
          <Link href="/perfil" className="btn-primary">Ver mis compras</Link>
          <Link href="/bonos" className="btn-secondary">Seguir comprando</Link>
        </div>
      </div>
    );
  }

  // Paso 2: adjuntar comprobante (solo transferencia)
  if (!hayItems && ventaPendiente) {
    return (
      <PasoComprobante
        ventaId={ventaPendiente.id}
        ordenId={ventaPendiente.ordenId}
        datosBanco={datosBanco}
        onCompletado={finalizarPasoComprobante}
      />
    );
  }

  // Carrito vacío
  if (!hayItems) {
    return (
      <div className="container-page flex flex-col items-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Trash2 className="h-8 w-8 text-slate-400" />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Tu carrito está vacío</h1>
        <p className="mt-2 text-slate-500">Agrega bonos solidarios para continuar.</p>
        <Link href="/bonos" className="btn-primary mt-6">Explorar bonos</Link>
      </div>
    );
  }

  // Paso 1: revisar carrito y método de pago
  return (
    <div className="container-page py-10">
      <div className="mb-8 flex items-center gap-2 text-sm">
        <span className="rounded-full bg-brand-600 px-3 py-1 font-medium text-white">
          1 · Método de pago
        </span>
        <ArrowRight className="h-4 w-4 text-slate-400" />
        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-500">
          2 · Comprobante de pago
        </span>
      </div>

      <h1 className="text-3xl font-bold text-slate-900">Finalizar compra</h1>
      <p className="mt-1 text-slate-500">Revisa tu carrito, elige el método de pago y confirma.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <ul className="divide-y divide-slate-200">
              {items.map((item) => (
                <li key={item.bonoId} className="flex items-center gap-4 p-4">
                  {item.imagen ? (
                    <Image
                      src={item.imagen}
                      alt={item.titulo || ""}
                      width={72}
                      height={72}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                      <Building2 className="h-7 w-7" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{item.titulo}</p>
                    <p className="text-sm text-slate-500">{formatCurrency(item.valor || 0)} c/u</p>
                    <div className="mt-2 flex items-center gap-2">
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
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency((item.valor || 0) * item.cantidad)}
                    </p>
                    <button
                      onClick={() => eliminar(item.bonoId)}
                      className="mt-1 text-slate-400 hover:text-red-600"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Métodos de pago */}
          <div className="card mt-6 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Método de pago</h2>
            <div className="mt-4 space-y-3">
              {metodosPago.map((m) => {
                const Icono = m.icono;
                return (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      metodoPago === m.id
                        ? "border-brand-600 bg-brand-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodoPago"
                      value={m.id}
                      checked={metodoPago === m.id}
                      onChange={() => setMetodoPago(m.id)}
                      className="accent-brand-600"
                    />
                    <Icono className="h-5 w-5 text-brand-600" />
                    <span className="text-sm font-medium text-slate-800">{m.label}</span>
                  </label>
                );
              })}
            </div>

            {metodoPago === "transferencia" && (
              <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50 p-4">
                <h3 className="text-sm font-semibold text-brand-900">Datos para transferencia</h3>
                <dl className="mt-2 space-y-1 text-sm text-slate-700">
                  <div className="flex justify-between"><dt className="text-slate-500">Banco:</dt><dd>{datosBanco.nombre || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Cuenta:</dt><dd>{datosBanco.numeroCuenta || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Tipo:</dt><dd>{datosBanco.tipoCuenta || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Titular:</dt><dd>{datosBanco.titular || "—"}</dd></div>
                </dl>
                <p className="mt-3 text-xs text-brand-700">
                  Realiza la transferencia y confirma tu compra. En el siguiente paso adjuntarás tu
                  comprobante de pago.
                </p>
              </div>
            )}

            {metodoPago === "tarjeta" && (
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  La integración con pasarela de pago (Stripe, PayPal) estará disponible próximamente.
                  Mientras tanto, contacta a soporte para completar tu compra con tarjeta.
                </p>
              </div>
            )}

            {metodoPago === "efectivo" && (
              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  Puedes pagar en efectivo en nuestro punto de venta. La dirección y horario te serán
                  enviados por correo al confirmar la compra. No se requiere comprobante.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div>
          <div className="card sticky top-24 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Resumen</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Subtotal</dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Envío</dt>
                <dd>Gratis</dd>
              </div>
              <div className="my-3 border-t border-slate-200" />
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <dt>Total</dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
            </dl>

            {status === "loading" ? (
              <div className="mt-6 flex justify-center"><Spinner /></div>
            ) : status === "unauthenticated" ? (
              <div className="mt-6">
                <p className="mb-3 text-sm text-slate-500">
                  Para completar la compra necesitas una cuenta.
                </p>
                <button onClick={() => signIn()} className="btn-primary w-full">
                  Iniciar sesión
                </button>
                <Link href="/register" className="btn-secondary mt-2 w-full">
                  Crear cuenta
                </Link>
              </div>
            ) : (
              <button
                onClick={confirmarCompra}
                disabled={confirmando || metodoPago === "tarjeta"}
                className="btn-primary mt-6 w-full"
              >
                {confirmando ? <Spinner size={18} /> : <ShieldCheck className="h-4 w-4" />}
                Confirmar compra
              </button>
            )}
            <p className="mt-3 text-center text-xs text-slate-400">
              Al confirmar aceptas nuestros términos y condiciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}