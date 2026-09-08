import mongoose, { Schema, models, model } from "mongoose";
import { ESTADOS_BONO } from "@/utils/constants";

export interface IBono {
  _id?: mongoose.Types.ObjectId;
  titulo: string;
  descripcion: string;
  valor: number;
  fechaEmision: Date;
  fechaVencimiento?: Date | null;
  imagen?: string;
  estado: string;
  stock: number | null;
  vendidoPor?: mongoose.Types.ObjectId | null;
  fechaCreacion: Date;
}

const BonoSchema = new Schema<IBono>(
  {
    titulo: { type: String, required: [true, "El título es requerido"], trim: true },
    descripcion: { type: String, required: [true, "La descripción es requerida"] },
    valor: { type: Number, required: [true, "El valor es requerido"], min: 0 },
    fechaEmision: { type: Date, required: [true, "La fecha de emisión es requerida"] },
    fechaVencimiento: { type: Date },
    imagen: { type: String },
    estado: {
      type: String,
      enum: Object.values(ESTADOS_BONO),
      default: ESTADOS_BONO.ACTIVO
    },
    stock: { type: Number, default: null },
    vendidoPor: { type: Schema.Types.ObjectId, ref: "User" },
    fechaCreacion: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Bono = models.Bono || model<IBono>("Bono", BonoSchema);

export default Bono;