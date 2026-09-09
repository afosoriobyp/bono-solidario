import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Carrito from "@/models/Carrito";
import { connectDB } from "@/lib/db";
import { carritoItemSchema } from "@/utils/validations";
import { unauthorized, apiError } from "@/lib/api";

async function obtenerCarrito(userId: string) {
  await connectDB();
  let carrito = await Carrito.findOne({ usuario: userId }).populate("items.bonoId");
  if (!carrito) {
    carrito = await Carrito.create({ usuario: userId, items: [] });
  }
  return carrito;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const carrito = await obtenerCarrito(session.user.id);
  return Response.json({ carrito });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  try {
    const body = await req.json();
    const parsed = carritoItemSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const carrito = await obtenerCarrito(session.user.id);
    const item = carrito.items.find(
      (i: any) => i.bonoId._id.toString() === parsed.data.bonoId
    );

    if (item) {
      if (parsed.data.numeros) {
        item.numeros = parsed.data.numeros;
        item.cantidad = 0;
      } else {
        item.cantidad += parsed.data.cantidad;
      }
    } else {
      carrito.items.push({
        bonoId: parsed.data.bonoId,
        numeros: parsed.data.numeros || [],
        cantidad: parsed.data.numeros ? 0 : parsed.data.cantidad
      });
    }

    carrito.fechaActualizacion = new Date();
    await carrito.save();
    const poblado = await carrito.populate("items.bonoId");
    return Response.json({ carrito: poblado });
  } catch (error) {
    return apiError(error, "No se pudo agregar al carrito");
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  try {
    const body = await req.json();
    const parsed = carritoItemSchema.partial().safeParse(body);
    if (!parsed.success) return Response.json({ error: "Datos inválidos" }, { status: 400 });
    if (!parsed.data.bonoId) return Response.json({ error: "bonoId requerido" }, { status: 400 });

    const carrito = await obtenerCarrito(session.user.id);
    const item = carrito.items.find(
      (i: any) => i.bonoId._id.toString() === parsed.data.bonoId
    );

    if (!item) return Response.json({ error: "Item no está en el carrito" }, { status: 404 });

    // Actualizar números de un bono numerado
    if (parsed.data.numeros !== undefined) {
      item.numeros = parsed.data.numeros;
      item.cantidad = 0;
    } else {
      const cantidad = parsed.data.cantidad ?? item.cantidad;
      if (cantidad <= 0) {
        carrito.items = carrito.items.filter(
          (i: any) => i.bonoId._id.toString() !== parsed.data.bonoId
        );
      } else {
        item.cantidad = cantidad;
      }
    }

    carrito.fechaActualizacion = new Date();
    await carrito.save();
    const poblado = await carrito.populate("items.bonoId");
    return Response.json({ carrito: poblado });
  } catch (error) {
    return apiError(error, "No se pudo actualizar el carrito");
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const bonoId = body.bonoId as string | undefined;

    const carrito = await obtenerCarrito(session.user.id);
    if (bonoId) {
      carrito.items = carrito.items.filter(
        (i: any) => i.bonoId._id.toString() !== bonoId
      );
    } else {
      carrito.items = [];
    }
    carrito.fechaActualizacion = new Date();
    await carrito.save();
    return Response.json({ carrito });
  } catch (error) {
    return apiError(error, "No se pudo actualizar el carrito");
  }
}