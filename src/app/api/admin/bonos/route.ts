import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listarBonos, crearBono } from "@/services/bonoService";
import { forbidden, unauthorized, apiError } from "@/lib/api";
import { bonoSchema } from "@/utils/validations";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (!["admin", "vendedor"].includes(session.user.rol || "")) return forbidden();

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado") || "todos";
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;

  try {
    const { bonos, total, totalPages } = await listarBonos({
      search: search || undefined,
      estado,
      page,
      limit,
      soloActivos: false
    });
    return Response.json({ bonos, total, totalPages, page });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (!["admin", "vendedor"].includes(session.user.rol || "")) return forbidden();

  try {
    const body = await req.json();
    const parsed = bonoSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    const data = {
      ...parsed.data,
      fechaEmision: new Date(parsed.data.fechaEmision),
      fechaVencimiento: parsed.data.fechaVencimiento
        ? new Date(parsed.data.fechaVencimiento)
        : undefined,
      vendidoPor:
        session.user.rol === "admin"
          ? parsed.data.vendidoPor || null
          : (session.user.id as string)
    };

    const bono = await crearBono(data);
    return Response.json({ bono }, { status: 201 });
  } catch (error) {
    return apiError(error, "No se pudo crear el bono");
  }
}