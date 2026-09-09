import mongoose, { Schema, models, model } from "mongoose";
import { ESTADOS_VENTA, METODOS_PAGO } from "@/utils/constants";

export interface IVenta {
  _id?: mongoose.Types.ObjectId;
  ordenId: string;
  usuario: mongoose.Types.ObjectId;
  datosComprador?: {
    nombre?: string;
    email?: string;
    telefono?: string;
  };
  bonos: {
    bonoId: mongoose.Types.ObjectId;
    titulo?: string;
    numero?: string | null;
    cantidad: number;
    precioUnitario: number;
  }[];
  total: number;
  estado: string;
  metodoPago?: string;
  comprobantePago?: string;
  datosTransferencia?: {
    banco?: string;
    numeroCuenta?: string;
    titular?: string;
    referencia?: string;
  };
  fechaVenta: Date;
  fechaPago?: Date | null;
}

const VentaSchema = new Schema<IVenta>(
  {
    ordenId: { type: String, required: true, unique: true },
    usuario: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bonos: [
      {
        bonoId: { type: Schema.Types.ObjectId, ref: "Bono", required: true },
        titulo: { type: String },
        numero: { type: String },
        cantidad: { type: Number, required: true, min: 1 },
        precioUnitario: { type: Number, required: true }
      }
    ],
    total: { type: Number, required: true },
    estado: {
      type: String,
      enum: Object.values(ESTADOS_VENTA),
      default: ESTADOS_VENTA.PENDIENTE
    },
    metodoPago: { type: String, enum: Object.values(METODOS_PAGO) },
    comprobantePago: { type: String },
    datosComprador: {
      nombre: String,
      email: String,
      telefono: String
    },
    datosTransferencia: {
      banco: String,
      numeroCuenta: String,
      titular: String,
      referencia: String
    },
    fechaVenta: { type: Date, default: Date.now },
    fechaPago: { type: Date }
  },
  { timestamps: true }
);

const Venta = models.Venta || model<IVenta>("Venta", VentaSchema);

export default Venta;