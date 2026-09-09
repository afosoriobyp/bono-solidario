import { connectDB } from "@/lib/db";
import Venta, { IVenta } from "@/models/Venta";
import Bono, { IBono } from "@/models/Bono";
import mongoose from "mongoose";
import { generateOrderId } from "@/utils/helpers";

export interface ItemVenta {
  bonoId: string;
  cantidad: number;
}

export type VentaPopulada = IVenta & {
  datosComprador?: { nombre?: string; email?: string; telefono?: string };
  usuario?: { _id: string; nombre?: string; email?: string } | string;
  bonos: (IVenta["bonos"][number] & { bonoId: any })[];
};

export async function crearVenta(data: {
  usuario: string;
  items: ItemVenta[];
  metodoPago?: string;
  estado?: string;
  fechaPago?: Date | null;
  comprobantePago?: string;
  datosComprador?: {
    nombre?: string;
    email?: string;
    telefono?: string;
  };
  datosTransferencia?: {
    banco?: string;
    numeroCuenta?: string;
    titular?: string;
    referencia?: string;
  };
}) {
  await connectDB();

  // Resolver bonos y calcular total
  const ids = data.items.map((i) => i.bonoId);
  const bonosRaw = await Bono.find({ _id: { $in: ids } }).lean();
  const bonos = bonosRaw as unknown as Pick<IBono, "_id" | "titulo" | "valor" | "stock">[];

  const bonosVenta = data.items.map((item) => {
    const bono = bonos.find((b) => String(b._id) === item.bonoId);
    if (!bono) throw new Error(`Bono no encontrado: ${item.bonoId}`);
    return {
      bonoId: bono._id as mongoose.Types.ObjectId,
      titulo: bono.titulo,
      cantidad: item.cantidad,
      precioUnitario: bono.valor
    };
  });

  const total = bonosVenta.reduce(
    (acc, b) => acc + b.precioUnitario * b.cantidad,
    0
  );

  const venta = await Venta.create({
    ordenId: generateOrderId(),
    usuario: data.usuario,
    datosComprador: data.datosComprador,
    bonos: bonosVenta,
    total,
    estado: data.estado,
    fechaPago: data.fechaPago ?? null,
    metodoPago: data.metodoPago,
    comprobantePago: data.comprobantePago,
    datosTransferencia: data.datosTransferencia
  });

  // Descontar stock si aplica
  for (const item of data.items) {
    const bono = bonos.find((b) => String(b._id) === item.bonoId);
    if (bono && bono.stock != null && bono.stock > 0) {
      await Bono.findByIdAndUpdate(bono._id, { $inc: { stock: -item.cantidad } });
    }
  }

  return venta;
}

export async function listarVentas(filtro: Record<string, unknown> = {}) {
  await connectDB();
  const ventas = await Venta.find(filtro)
    .populate("usuario", "nombre email")
    .sort({ fechaVenta: -1 })
    .lean();
  return ventas as unknown as VentaPopulada[];
}

export async function obtenerVenta(id: string) {
  await connectDB();
  const venta = await Venta.findById(id)
    .populate("usuario", "nombre email")
    .populate("bonos.bonoId", "titulo valor imagen")
    .lean();
  return venta as unknown as VentaPopulada | null;
}

export async function actualizarEstadoVenta(id: string, estado: string) {
  await connectDB();
  const update: Record<string, unknown> = { estado };
  if (estado === "pagado") update.fechaPago = new Date();
  const venta = await Venta.findByIdAndUpdate(id, update, { new: true }).lean();
  return venta as unknown as IVenta | null;
}