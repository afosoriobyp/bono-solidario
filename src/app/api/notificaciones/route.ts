import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Notification from "@/models/Notification";
import { connectDB } from "@/lib/db";
import { unauthorized } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const { searchParams } = new URL(req.url);
  const solonoleidas = searchParams.get("soloNoLeidas") === "true";

  await connectDB();
  const filter: Record<string, any> = { usuario: session.user.id };
  if (solonoleidas) filter.leida = false;

  const notificaciones = await Notification.find(filter)
    .sort({ fechaCreacion: -1 })
    .limit(50)
    .lean();

  return Response.json({ notificaciones });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  try {
    const body = await req.json();
    await connectDB();

    if (body.todas === true) {
      await Notification.updateMany({ usuario: session.user.id }, { leida: true });
    } else if (body.id) {
      await Notification.updateOne(
        { _id: body.id, usuario: session.user.id },
        { leida: true }
      );
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}