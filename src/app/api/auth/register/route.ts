import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/utils/validations";
import { ROLES } from "@/utils/constants";
import { apiError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    await connectDB();

    const existe = await User.findOne({ email: parsed.data.email.toLowerCase() });
    if (existe) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(parsed.data.password, 10);

    const user = await User.create({
      nombre: parsed.data.nombre,
      email: parsed.data.email.toLowerCase(),
      password: hashed,
      telefono: parsed.data.telefono,
      rol: ROLES.USUARIO
    });

    return NextResponse.json(
      { user: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol } },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error, "No se pudo registrar el usuario");
  }
}