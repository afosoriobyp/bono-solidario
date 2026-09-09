import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Venta from "@/models/Venta";
import Bono from "@/models/Bono";
import { connectDB } from "@/lib/db";
import { unauthorized } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  await connectDB();
  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado") || "";

  const filter: Record<string, any> = { usuario: session.user.id };
  if (estado && estado !== "todos") filter.estado = estado;

  const ventas = await Venta.find(filter)
    .sort({ fechaVenta: -1 })
    .populate("bonos.bonoId", "titulo imagen valor")
    .lean();

  return Response.json({ ventas });
}