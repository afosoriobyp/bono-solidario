import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Venta from "@/models/Venta";
import type { IVenta } from "@/models/Venta";
import Bono from "@/models/Bono";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { unauthorized, forbidden } from "@/lib/api";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return unauthorized();
  if (!["admin", "vendedor"].includes(session.user.rol || "")) return forbidden();

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "global"; // global (admin) | personal (vendedor)
  const esVendedor = session.user.rol === "vendedor";

  await connectDB();

  const baseVentaFilter: Record<string, any> = {};
  if (esVendedor || scope === "personal") {
    // Ventas donde el vendedor vendió alguno de los bonos
    const bonosDelVendedor = await Bono.find({ vendidoPor: session.user.id }).select("_id").lean();
    const ids = bonosDelVendedor.map((b) => b._id);
    baseVentaFilter["bonos.bonoId"] = { $in: ids };
  }

  const now = new Date();
  const mesInicio = startOfMonth(now);
  const anioInicio = startOfYear(now);

  const ventasMes = await Venta.find({ ...baseVentaFilter, fechaVenta: { $gte: mesInicio } }).lean() as unknown as IVenta[];
  const ventasAnio = await Venta.find({ ...baseVentaFilter, fechaVenta: { $gte: anioInicio } }).lean() as unknown as IVenta[];

  const ingresosMes = ventasMes
    .filter((v) => v.estado !== "cancelado")
    .reduce((s, v) => s + v.total, 0);
  const ingresosAnio = ventasAnio
    .filter((v) => v.estado !== "cancelado")
    .reduce((s, v) => s + v.total, 0);

  const cantidadVendidaMes = ventasMes.reduce(
    (s, v) => s + v.bonos.reduce((a, b) => a + b.cantidad, 0),
    0
  );

  // Ventas pendientes
  const pendientes = await Venta.countDocuments({
    ...baseVentaFilter,
    estado: "pendiente"
  });

  // Ventas por mes (últimos 6 meses)
  const meses: { label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const ventas = await Venta.find({
      ...baseVentaFilter,
      fechaVenta: { $gte: d, $lt: next }
    }).lean() as unknown as IVenta[];
    const total = ventas
      .filter((v) => v.estado !== "cancelado")
      .reduce((s, v) => s + v.total, 0);
    meses.push({
      label: d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" }),
      total
    });
  }

  // Bonos más vendidos
  const ventasPeriodo = await Venta.find({
    ...baseVentaFilter,
    estado: { $ne: "cancelado" },
    fechaVenta: { $gte: anioInicio }
  }).lean() as unknown as IVenta[];
  const conteoBonos: Record<string, { nombre: string; cantidad: number; ingresos: number }> = {};
  for (const venta of ventasPeriodo) {
    for (const item of venta.bonos) {
      const key = String(item.bonoId);
      if (!conteoBonos[key]) {
        conteoBonos[key] = { nombre: item.titulo || key, cantidad: 0, ingresos: 0 };
      }
      conteoBonos[key].cantidad += item.cantidad;
      conteoBonos[key].ingresos += item.precioUnitario * item.cantidad;
    }
  }
  const topBonos = Object.values(conteoBonos)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  // Método de pago
  const metodos: Record<string, number> = {};
  for (const venta of ventasAnio) {
    if (venta.estado === "cancelado") continue;
    const m = venta.metodoPago || "sin_definir";
    metodos[m] = (metodos[m] || 0) + 1;
  }

  // Resultados según rol
  let reporte: Record<string, unknown> = {
    kpis: {
      ventasMes: ventasMes.length,
      ventasAnio: ventasAnio.length,
      ingresosMes,
      ingresosAnio,
      bonosVendidosMes: cantidadVendidaMes,
      ventasPendientes: pendientes
    },
    ventasPorMes: meses,
    topBonos,
    metodosPago: metodos
  };

  if (session.user.rol === "admin") {
    const [totalUsuarios, totalBonos, bonosActivos, bonosInactivos] = await Promise.all([
      User.countDocuments(),
      Bono.countDocuments(),
      Bono.countDocuments({ estado: "activo" }),
      Bono.countDocuments({ estado: { $in: ["inactivo", "agotado"] } })
    ]);

    reporte.kpis = {
      ...(reporte.kpis as Record<string, unknown>),
      totalUsuarios,
      totalBonos,
      bonosActivos,
      bonosInactivos
    };
  }

  return Response.json({ reporte });
}