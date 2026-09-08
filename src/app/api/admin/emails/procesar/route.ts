import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { procesarCola, statsCola } from "@/services/emailQueueService";
import { unauthorized, forbidden } from "@/lib/api";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (session.user.rol !== "admin") return forbidden();

  const body = await req.json().catch(() => ({}));
  const limite = Math.min(50, Number(body.limite) || 20);

  const resultado = await procesarCola(limite);
  const stats = await statsCola();

  return Response.json({ ...resultado, stats });
}