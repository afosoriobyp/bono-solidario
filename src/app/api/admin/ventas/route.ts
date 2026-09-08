import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Venta from "@/models/Venta";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { ESTADOS_VENTA } from "@/utils/constants";
import { unauthorized, forbidden, apiError } from "@/lib/api";

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (session.user.rol !== "admin") return forbidden();

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado") || "";
  const usuario = searchParams.get("usuario") || "";
  const desde = searchParams.get("desde") || "";
  const hasta = searchParams.get("hasta") || "";
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Number(searchParams.get("limit")) || 10);

  const filter: Record<string, any> = {};
  if (estado && estado !== "todos") filter.estado = estado;
  if (usuario) filter.usuario = usuario;
  if (desde || hasta) {
    filter.fechaVenta = {};
    if (desde) filter.fechaVenta.$gte = new Date(desde);
    if (hasta) filter.fechaVenta.$lte = new Date(hasta);
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ ordenId: regex }, { "bonos.titulo": regex }];
    // Coincidencias por nombre/email de cliente
    const users = await User.find({
      $or: [{ nombre: regex }, { email: regex }]
    })
      .select("_id")
      .lean();
    const ids = users.map((u) => u._id);
    if (ids.length) filter.$or.push({ usuario: { $in: ids } });
  }

  await connectDB();
  const skip = (page - 1) * limit;

  const [ventas, total] = await Promise.all([
    Venta.find(filter)
      .populate("usuario", "nombre email")
      .sort({ fechaVenta: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Venta.countDocuments(filter)
  ]);

  return Response.json({ ventas, total, totalPages: Math.ceil(total / limit), page });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (session.user.rol !== "admin") return forbidden();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();

    if (!id) return Response.json({ error: "id requerido" }, { status: 400 });
    if (!Object.values(ESTADOS_VENTA).includes(body.estado)) {
      return Response.json({ error: "Estado inválido" }, { status: 400 });
    }

    await connectDB();
    const update: Record<string, any> = { estado: body.estado };
    if (body.estado === "pagado") update.fechaPago = new Date();
    if (body.estado === "cancelado") update.fechaPago = null;

    const venta = await Venta.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!venta) return Response.json({ error: "Venta no encontrada" }, { status: 404 });

    return Response.json({ venta });
  } catch (error) {
    return apiError(error, "No se pudo actualizar la venta");
  }
}