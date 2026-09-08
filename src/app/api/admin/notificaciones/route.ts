import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { unauthorized, forbidden, apiError } from "@/lib/api";
import { encolarEmails, statsCola } from "@/services/emailQueueService";
import { mailTemplate } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (session.user.rol !== "admin") return forbidden();

  await connectDB();
  const notificaciones = await Notification.find({})
    .populate("usuario", "nombre email")
    .sort({ fechaCreacion: -1 })
    .limit(100)
    .lean();

  const stats = await statsCola();

  return Response.json({ notificaciones, stats });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (session.user.rol !== "admin") return forbidden();

  try {
    const body = await req.json();
    if (!body.titulo || !body.mensaje) {
      return Response.json({ error: "Título y mensaje requeridos" }, { status: 400 });
    }

    await connectDB();

    // Destinatarios: un usuario concreto, o todos de un rol, o todos
    let destinatarios: { id?: string; email?: string; rol?: string }[] = [];
    if (body.usuarioId) {
      const userRaw = await User.findById(body.usuarioId).select("_id email").lean();
      const user = userRaw as unknown as { _id: string; email?: string } | null;
      if (user) destinatarios = [{ id: String(user._id), email: user.email }];
    } else if (body.rol) {
      const users = await User.find({ rol: body.rol, activo: true }).select("_id email").lean();
      destinatarios = (users as unknown as { _id: string; email?: string }[]).map((u) => ({
        id: String(u._id),
        email: u.email
      }));
    } else {
      const users = await User.find({ activo: true }).select("_id email").lean();
      destinatarios = (users as unknown as { _id: string; email?: string }[]).map((u) => ({
        id: String(u._id),
        email: u.email
      }));
    }

    const docs = destinatarios.map((d) => ({
      usuario: d.id,
      rol: body.rol,
      titulo: body.titulo,
      mensaje: body.mensaje,
      tipo: body.tipo || "general"
    }));

    const creadas = await Notification.insertMany(docs);

    // Envío masivo opcional por correo (cola de emails)
    let emailsEncolados = 0;
    if (body.enviarCorreo === true) {
      const html = mailTemplate(
        body.titulo,
        `<p>${body.mensaje.replace(/\n/g, "<br/>")}</p>
         <p style="font-size:12px;color:#64748b">Este mensaje fue enviado por el equipo de Bono Solidario.</p>`
      );
      const conEmail = destinatarios.filter((d) => d.email) as { email: string }[];
      emailsEncolados = await encolarEmails(
        conEmail.map((d) => ({
          para: d.email,
          asunto: body.titulo,
          html,
          tipo: "masivo"
        }))
      );
    }

    return Response.json(
      {
        notificaciones: creadas,
        enviadasA: destinatarios.length,
        emailsEncolados,
        stats: await statsCola()
      },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error, "No se pudo enviar la notificación");
  }
}