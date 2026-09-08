import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { r2Configurado } from "@/lib/r2";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Diagnóstico de configuración para producción.
 * NO expone secretos, solo indica si cada variable está configurada.
 */
export async function GET(req: NextRequest) {
  const check = (name: string) => Boolean(process.env[name]);

  const env = {
    MONGODB_URI: check("MONGODB_URI"),
    NEXTAUTH_SECRET: check("NEXTAUTH_SECRET"),
    NEXTAUTH_URL: check("NEXTAUTH_URL"),
    ADMIN_EMAIL: check("ADMIN_EMAIL"),
    BREVO_API_KEY: check("BREVO_API_KEY"),
    BREVO_DAILY_LIMIT: check("BREVO_DAILY_LIMIT"),
    CRON_SECRET: check("CRON_SECRET"),
    R2: r2Configurado(),
    EMAIL_USER: check("EMAIL_USER")
  };

  let db = "no probado";
  try {
    await connectDB();
    db = "ok";
  } catch (e) {
    db = e instanceof Error ? e.message : "error desconocido";
  }

  return Response.json({ ok: db === "ok", env, db, hora: new Date().toISOString() });
}