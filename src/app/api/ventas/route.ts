import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { crearVenta } from "@/services/ventaService";
import {
  notificarCompraExitosa,
  notificarNuevaVentaAdmin
} from "@/services/notificacionService";
import Carrito from "@/models/Carrito";
import Bono from "@/models/Bono";
import User from "@/models/User";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { crearVentaSchema } from "@/utils/validations";
import { validarNumero } from "@/utils/helpers";
import { unauthorized, forbidden, apiError, getErrorMessage } from "@/lib/api";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  try {
    const body = await req.json();
    const parsed = crearVentaSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    // "Efectivo" solo permitido para admin/vendedor
    if (
      parsed.data.metodoPago === "efectivo" &&
      !["admin", "vendedor"].includes(session.user.rol || "")
    ) {
      return forbidden();
    }

    await connectDB();

    // Verificar stock disponible y números de numeración
    const ids = parsed.data.items.map((i) => i.bonoId);
    const bonosRaw = await Bono.find({ _id: { $in: ids }, estado: "activo" }).lean();
    const bonos = bonosRaw as unknown as {
      _id: mongoose.Types.ObjectId;
      titulo: string;
      stock: number | null;
      numeracion: string | null;
      numerosUsados: string[];
    }[];
    const numerosSolicitados = new Set<string>();
    for (const item of parsed.data.items) {
      const bono = bonos.find((b) => String(b._id) === item.bonoId);
      if (!bono) {
        return Response.json({ error: "Uno de los bonos no está disponible" }, { status: 400 });
      }
      if (bono.stock != null && bono.stock < item.cantidad) {
        return Response.json(
          { error: `Stock insuficiente para "${bono.titulo}"` },
          { status: 400 }
        );
      }
      if (bono.numeracion) {
        if (!item.numero) {
          return Response.json(
            { error: `Debes seleccionar un número para "${bono.titulo}"` },
            { status: 400 }
          );
        }
        if (!validarNumero(item.numero, bono.numeracion)) {
          return Response.json(
            { error: `Número inválido para "${bono.titulo}"` },
            { status: 400 }
          );
        }
        if (bono.numerosUsados.includes(item.numero) || numerosSolicitados.has(item.numero)) {
          return Response.json(
            { error: `El número ${item.numero} del bono "${bono.titulo}" ya no está disponible` },
            { status: 400 }
          );
        }
        numerosSolicitados.add(item.numero);
      }
    }

    const venta = await crearVenta({
      usuario: session.user.id,
      items: parsed.data.items,
      metodoPago: parsed.data.metodoPago,
      comprobantePago: parsed.data.comprobantePago || undefined,
      datosComprador: parsed.data.datosComprador,
      datosTransferencia: parsed.data.datosTransferencia,
      // Efectivo en punto de venta se considera pagado al momento
      estado: parsed.data.metodoPago === "efectivo" ? "pagado" : undefined,
      fechaPago: parsed.data.metodoPago === "efectivo" ? new Date() : undefined
    });

    // Vaciar carrito del usuario
    await Carrito.findOneAndUpdate({ usuario: session.user.id }, { items: [] });

    const usuarioRaw = await User.findById(session.user.id).lean();
    const usuario = usuarioRaw as unknown as { nombre?: string; email?: string } | null;
    const ventaLean = venta.toObject();

    // Prioridad: datos del comprador registrados (staff) > datos de la sesión
    const comprador = ventaLean.datosComprador || {};
    const nombreComprador = comprador.nombre || usuario?.nombre || session.user.name || "Cliente";
    const emailComprador =
      comprador.email || usuario?.email || session.user.email || "";

    const notifData = {
      ordenId: ventaLean.ordenId,
      nombreUsuario: nombreComprador,
      emailUsuario: emailComprador,
      items: ventaLean.bonos.map((b: any) => ({
        titulo: b.titulo,
        numero: b.numero || null,
        cantidad: b.cantidad,
        precioUnitario: b.precioUnitario
      })),
      total: ventaLean.total,
      fechaVenta: ventaLean.fechaVenta,
      metodoPago: ventaLean.metodoPago,
      estado: ventaLean.estado,
      comprobanteUrl: ventaLean.comprobantePago
    };

    // Notificaciones por correo: se encolan (escritura rápida) y se procesa un
// lote pequeño. Se espera para garantizar el envío en serverless (Vercel
// termina la función al responder). No bloquea: son operaciones de pocos ms.
    try {
      await notificarCompraExitosa(notifData);
    } catch (e) {
      console.error("Error email compra:", getErrorMessage(e));
    }
    try {
      await notificarNuevaVentaAdmin(notifData);
    } catch (e) {
      console.error("Error email admin:", getErrorMessage(e));
    }
    try {
      const { procesarCola } = await import("@/services/emailQueueService");
      await procesarCola(5);
    } catch (e) {
      console.error("Error procesando cola:", getErrorMessage(e));
    }

    return Response.json({ venta: ventaLean }, { status: 201 });
  } catch (error) {
    return apiError(error, "No se pudo registrar la venta");
  }
}