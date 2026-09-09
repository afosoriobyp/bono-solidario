import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Venta from "@/models/Venta";
import type { IVenta } from "@/models/Venta";
import Bono from "@/models/Bono";
import { connectDB } from "@/lib/db";
import { unauthorized, notFound, forbidden, apiError } from "@/lib/api";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  try {
    await connectDB();
    const ventaRaw = await Venta.findById(params.id)
      .populate("usuario", "nombre email")
      .populate("bonos.bonoId", "titulo valor imagen")
      .lean();
    const venta = ventaRaw as unknown as IVenta & {
      usuario: { _id: string; nombre?: string; email?: string } | null;
    } | null;

    if (!venta) return notFound("Venta no encontrada");

    const rol = session.user.rol;
    const esStaff = rol === "admin" || rol === "vendedor";
    const usuarioId =
      venta.usuario && typeof venta.usuario === "object"
        ? String(venta.usuario._id)
        : String(venta.usuario);
    const esDueno = usuarioId === session.user.id;

    if (!esStaff && !esDueno) {
      return new Response(JSON.stringify({ error: "Acceso denegado" }), { status: 403 });
    }

    return Response.json({ venta });
  } catch (error) {
    return apiError(error, "No se pudo cargar el detalle de la venta");
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  try {
    const body = await req.json();
    const comprobante = typeof body.comprobantePago === "string" ? body.comprobantePago : undefined;
    const referencia = typeof body.referencia === "string" ? body.referencia : undefined;

    if (!comprobante && !referencia) {
      return Response.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    await connectDB();
    const venta = await Venta.findById(params.id);
    if (!venta) return notFound("Venta no encontrada");

    const rol = session.user.rol;
    const esStaff = rol === "admin" || rol === "vendedor";
    const esDueno = String(venta.usuario) === session.user.id;
    if (!esStaff && !esDueno) return forbidden();

    if (venta.estado !== "pendiente") {
      return Response.json(
        { error: "La venta ya fue procesada y no admite adjuntar comprobante" },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {};
    if (comprobante) update.comprobantePago = comprobante;
    if (referencia) update["datosTransferencia.referencia"] = referencia;

    const actualizada = await Venta.findByIdAndUpdate(params.id, update, { new: true }).lean();
    return Response.json({ venta: actualizada });
} catch (error) {
    return apiError(error, "No se pudo cargar el detalle de la venta");
  }
}
