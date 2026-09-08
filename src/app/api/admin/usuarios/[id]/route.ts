import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { ROLES } from "@/utils/constants";
import { unauthorized, forbidden, apiError } from "@/lib/api";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (session.user.rol !== "admin") return forbidden();

  try {
    const body = await req.json();
    await connectDB();

    const update: Record<string, any> = {};
    if (body.nombre) update.nombre = body.nombre;
    if (body.telefono !== undefined) update.telefono = body.telefono;
    if (body.rol && Object.values(ROLES).includes(body.rol)) update.rol = body.rol;
    if (typeof body.activo === "boolean") update.activo = body.activo;

    const user = await User.findByIdAndUpdate(params.id, update, { new: true })
      .select("-password")
      .lean();

    if (!user) return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
    return Response.json({ user });
  } catch (error) {
    return apiError(error, "No se pudo actualizar el usuario");
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (session.user.rol !== "admin") return forbidden();

  try {
    if (params.id === session.user.id) {
      return Response.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      params.id,
      { activo: false },
      { new: true }
    ).select("-password").lean();

    if (!user) return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
    return Response.json({ user, message: "Usuario desactivado" });
  } catch (error) {
    return apiError(error, "No se pudo eliminar el usuario");
  }
}