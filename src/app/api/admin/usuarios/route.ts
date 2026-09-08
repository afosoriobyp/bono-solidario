import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import { ROLES } from "@/utils/constants";
import { unauthorized, forbidden, apiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (session.user.rol !== "admin") return forbidden();

  await connectDB();
  const { searchParams } = new URL(req.url);
  const rol = searchParams.get("rol") || "";
  const search = searchParams.get("search") || "";

  const filter: Record<string, any> = {};
  if (rol && rol !== "todos") filter.rol = rol;
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ nombre: regex }, { email: regex }];
  }

  const users = await User.find(filter)
    .select("-password")
    .sort({ fechaCreacion: -1 })
    .lean();

  return Response.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (session.user.rol !== "admin") return forbidden();

  try {
    const body = await req.json();
    if (!body.nombre || !body.email || !body.password) {
      return Response.json({ error: "Nombre, email y contraseña son requeridos" }, { status: 400 });
    }
    if (!Object.values(ROLES).includes(body.rol)) {
      return Response.json({ error: "Rol inválido" }, { status: 400 });
    }

    await connectDB();
    const existe = await User.findOne({ email: body.email.toLowerCase() });
    if (existe) {
      return Response.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    const user = await User.create({
      nombre: body.nombre,
      email: body.email.toLowerCase(),
      password: await bcrypt.hash(body.password, 10),
      rol: body.rol,
      telefono: body.telefono
    });

    const userSafe = user.toObject();
    delete userSafe.password;
    return Response.json({ user: userSafe }, { status: 201 });
  } catch (error) {
    return apiError(error, "No se pudo crear el usuario");
  }
}