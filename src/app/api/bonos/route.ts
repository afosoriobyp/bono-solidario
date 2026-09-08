import { NextRequest } from "next/server";
import { listarBonos } from "@/services/bonoService";
import { notFound } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado") || "activo";
  const search = searchParams.get("search") || "";
  const min = searchParams.get("min");
  const max = searchParams.get("max");
  const emisionDesde = searchParams.get("emisionDesde") || "";
  const page = Number(searchParams.get("page")) || 1;

  // Público: siempre mostrar solo activos
  const { bonos, total, totalPages } = await listarBonos({
    search: search || undefined,
    estado: estado === "todos" ? undefined : estado,
    min: min ? Number(min) : undefined,
    max: max ? Number(max) : undefined,
    emisionDesde: emisionDesde || undefined,
    soloActivos: true,
    page,
    limit: 12
  });

  if (!bonos.length && page > 1) return notFound();

  return Response.json({ bonos, total, totalPages, page });
}