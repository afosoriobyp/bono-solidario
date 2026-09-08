import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Venta from "@/models/Venta";
import User from "@/models/User";
import Bono from "@/models/Bono";
import { connectDB } from "@/lib/db";
import { unauthorized, forbidden } from "@/lib/api";

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (session.user.rol !== "vendedor") return forbidden();

  await connectDB();

  const bonosDelVendedor = await Bono.find({ vendidoPor: session.user.id })
    .select("_id")
    .lean();
  const ids = bonosDelVendedor.map((b) => b._id);

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado") || "";
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Number(searchParams.get("limit")) || 10);

  const filter: Record<string, any> = { "bonos.bonoId": { $in: ids } };
  if (estado && estado !== "todos") filter.estado = estado;

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ ordenId: regex }, { "bonos.titulo": regex }];
    const users = await User.find({
      $or: [{ nombre: regex }, { email: regex }]
    })
      .select("_id")
      .lean();
    const userIds = users.map((u) => u._id);
    if (userIds.length) filter.$or.push({ usuario: { $in: userIds } });
  }

  const skip = (page - 1) * limit;
  const [ventas, total] = await Promise.all([
    Venta.find(filter)
      .populate("usuario", "nombre email")
      .populate("bonos.bonoId", "titulo valor imagen")
      .sort({ fechaVenta: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Venta.countDocuments(filter)
  ]);

  return Response.json({ ventas, total, totalPages: Math.ceil(total / limit), page });
}