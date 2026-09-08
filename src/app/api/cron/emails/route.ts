import { NextRequest } from "next/server";
import { procesarCola } from "@/services/emailQueueService";
import { forbidden } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Endpoint para Vercel Cron (u otro scheduler).
 * Protegido por el header Authorization: Bearer <CRON_SECRET>
 * o por el header x-vercel-cron (Vercel lo envía con valor "1").
 *
 * Nota: en el plan Hobby de Vercel el cron solo puede ejecutarse 1 vez al día.
 * Para despachos más frecuentes, usa un trigger externo (p. ej. Cloudflare
 * Workers) que llame a este endpoint con Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const vercelCron = req.headers.get("x-vercel-cron") || "";
  const secreto = process.env.CRON_SECRET;

  const valido =
    vercelCron === "1" ||
    (secreto && auth === `Bearer ${secreto}`);

  if (!valido) return forbidden();

  try {
    const resultado = await procesarCola(60);
    return Response.json({ ok: true, ...resultado });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error procesando la cola"
      },
      { status: 500 }
    );
  }
}