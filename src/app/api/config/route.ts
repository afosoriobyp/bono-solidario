import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unauthorized, forbidden } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();

  return Response.json({
    config: {
      banco: {
        nombre: process.env.BANCO_NOMBRE || "",
        numeroCuenta: process.env.BANCO_CUENTA || "",
        tipoCuenta: process.env.BANCO_TIPO_CUENTA || "",
        titular: process.env.BANCO_TITULAR || ""
      }
    }
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (session.user.rol !== "admin") return forbidden();

  // En esta implementación los datos vienen de variables de entorno.
  // Para persistencia se recomienda una colección "Configuracion".
  return Response.json({
    message:
      "Los datos de pago se gestionan mediante variables de entorno (BANCO_*). Consulte .env.example."
  });
}