import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { obtenerBono, actualizarBono, eliminarBono } from "@/services/bonoService";
import { bonoSchemaBase } from "@/utils/validations";
import { forbidden, notFound, unauthorized, apiError } from "@/lib/api";

type Params = { params: { id: string } };

async function puedeEditarBono(userId: string | undefined, rol: string | undefined, bono: Record<string, any>) {
  if (rol === "admin") return true;
  if (rol === "vendedor" && bono.vendidoPor?.toString() === userId) return true;
  return false;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (!["admin", "vendedor"].includes(session.user.rol || "")) return forbidden();

  try {
    const body = await req.json();
    const parsed = bonoSchemaBase.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    const actual = await obtenerBono(params.id);
    if (!actual) return notFound("Bono no encontrado");
    if (!puedeEditarBono(session.user.id, session.user.rol, actual)) return forbidden();

    const data: Record<string, any> = { ...parsed.data };
    if (data.fechaEmision) data.fechaEmision = new Date(data.fechaEmision);
    if (data.fechaVencimiento) data.fechaVencimiento = new Date(data.fechaVencimiento);
    delete data.vendidoPor;

    const bono = await actualizarBono(params.id, data);
    return Response.json({ bono });
  } catch (error) {
    return apiError(error, "No se pudo actualizar el bono");
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (!["admin", "vendedor"].includes(session.user.rol || "")) return forbidden();

  try {
    const actual = await obtenerBono(params.id);
    if (!actual) return notFound("Bono no encontrado");
    if (!puedeEditarBono(session.user.id, session.user.rol, actual)) return forbidden();

    const bono = await eliminarBono(params.id);
    return Response.json({ bono, message: "Bono eliminado" });
  } catch (error) {
    return apiError(error, "No se pudo eliminar el bono");
  }
}