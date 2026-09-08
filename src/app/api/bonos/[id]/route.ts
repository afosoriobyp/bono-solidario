import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { obtenerBono } from "@/services/bonoService";
import { forbidden, notFound, apiError } from "@/lib/api";

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    // Publico: puede ver el detalle; internos (admin/vendedor) pueden ver todos
    const bono = await obtenerBono(params.id);
    if (!bono) return notFound("Bono no encontrado");

    // Si no es admin/vendedor y el bono no está activo, denegar
    const esStaff = session && ["admin", "vendedor"].includes(session.user.rol || "");
    if (!esStaff && bono.estado !== "activo") {
      return forbidden();
    }

    return NextResponse.json({ bono });
  } catch (error) {
    return apiError(error);
  }
}