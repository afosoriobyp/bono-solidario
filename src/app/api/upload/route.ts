import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { unauthorized, forbidden } from "@/lib/api";
import { r2Configurado, subirArchivoR2, urlPublicaR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const CARPETAS = ["bonos", "comprobantes"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (!["usuario", "admin", "vendedor"].includes(session.user.rol || "")) return forbidden();

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const carpeta = (form.get("carpeta") as string) || "bonos";

    if (!file) {
      return Response.json({ error: "No se recibió archivo" }, { status: 400 });
    }
    if (!CARPETAS.includes(carpeta)) {
      return Response.json({ error: "Carpeta no permitida" }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return Response.json(
        { error: "Formato no permitido. Use JPG, PNG, WEBP o PDF." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ error: "El archivo supera los 5MB" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || (file.type === "application/pdf" ? ".pdf" : ".jpg");
    const nombre = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const key = `${carpeta}/${nombre}`;

    if (r2Configurado()) {
      await subirArchivoR2({ key, body: bytes, contentType: file.type });
      return Response.json({ url: urlPublicaR2(key) }, { status: 201 });
    }

    // En producción (Vercel) el filesystem es de solo lectura: se exige R2.
    if (process.env.NODE_ENV === "production") {
      return Response.json(
        { error: "Storage no configurado. Defina las variables de Cloudflare R2." },
        { status: 500 }
      );
    }

    // Fallback local (desarrollo sin credenciales R2)
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, nombre), bytes);

    return Response.json({ url: `/uploads/${nombre}` }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Error al subir archivo" },
      { status: 400 }
    );
  }
}