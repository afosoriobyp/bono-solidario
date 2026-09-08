import mongoose, { Schema, models, model } from "mongoose";

export interface IEmailQueue {
  _id?: mongoose.Types.ObjectId;
  para: string;
  asunto: string;
  html: string;
  tipo: "transaccional" | "masivo";
  estado: "pendiente" | "enviado" | "error" | "fallido";
  intentos: number;
  maxIntentos: number;
  bloqueadoHasta: Date;
  proximaIntento: Date;
  error?: string;
  fechaCreacion: Date;
  fechaEnvio?: Date | null;
}

const EmailQueueSchema = new Schema<IEmailQueue>(
  {
    para: { type: String, required: true, lowercase: true, trim: true },
    asunto: { type: String, required: true },
    html: { type: String, required: true },
    tipo: { type: String, enum: ["transaccional", "masivo"], default: "transaccional" },
    estado: {
      type: String,
      enum: ["pendiente", "enviado", "error", "fallido"],
      default: "pendiente",
      index: true
    },
    intentos: { type: Number, default: 0 },
    maxIntentos: { type: Number, default: 3 },
    bloqueadoHasta: { type: Date, default: new Date(0) },
    proximaIntento: { type: Date, default: Date.now },
    error: { type: String },
    fechaCreacion: { type: Date, default: Date.now },
    fechaEnvio: { type: Date }
  },
  { timestamps: true }
);

const EmailQueue =
  models.EmailQueue || model<IEmailQueue>("EmailQueue", EmailQueueSchema);

export default EmailQueue;