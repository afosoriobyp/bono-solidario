import { connectDB } from "@/lib/db";
import Bono, { IBono } from "@/models/Bono";
import { ESTADOS_BONO } from "@/utils/constants";

export type BonoQuery = {
  search?: string;
  estado?: string;
  min?: number;
  max?: number;
  emisionDesde?: string;
  page?: number;
  limit?: number;
  soloActivos?: boolean;
};

export type BonoPopulado = IBono & {
  vendidoPor?: { _id: string; nombre?: string; email?: string } | null;
};

export async function listarBonos(query: BonoQuery = {}) {
  await connectDB();

  const filter: Record<string, unknown> = {};

  if (query.soloActivos) {
    filter.estado = ESTADOS_BONO.ACTIVO;
  } else if (query.estado && query.estado !== "todos") {
    filter.estado = query.estado;
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ titulo: regex }, { descripcion: regex }];
  }

  if (query.min || query.max) {
    filter.valor = {};
    if (query.min) (filter.valor as Record<string, unknown>).$gte = query.min;
    if (query.max) (filter.valor as Record<string, unknown>).$lte = query.max;
  }

  if (query.emisionDesde) {
    filter.fechaEmision = { $gte: new Date(query.emisionDesde) };
  }

  const page = query.page || 1;
  const limit = query.limit || 12;
  const skip = (page - 1) * limit;

  const [bonos, total] = await Promise.all([
    Bono.find(filter).sort({ fechaCreacion: -1 }).skip(skip).limit(limit).lean(),
    Bono.countDocuments(filter)
  ]);

  return {
    bonos: bonos as unknown as IBono[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function obtenerBono(id: string) {
  await connectDB();
  const bono = await Bono.findById(id).populate("vendidoPor", "nombre email").lean();
  return bono as unknown as BonoPopulado | null;
}

export async function crearBono(data: Record<string, unknown>) {
  await connectDB();
  return Bono.create(data);
}

export async function actualizarBono(id: string, data: Record<string, unknown>) {
  await connectDB();
  const bono = await Bono.findByIdAndUpdate(id, data, { new: true }).lean();
  return bono as unknown as IBono | null;
}

export async function eliminarBono(id: string) {
  await connectDB();
  // Soft delete: cambia estado a inactivo en lugar de borrar
  const bono = await Bono.findByIdAndUpdate(id, { estado: ESTADOS_BONO.INACTIVO }, { new: true }).lean();
  return bono as unknown as IBono | null;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}