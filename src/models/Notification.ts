import mongoose, { Schema, models, model } from "mongoose";

export interface INotification {
  _id?: mongoose.Types.ObjectId;
  usuario?: mongoose.Types.ObjectId;
  rol?: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  fechaCreacion: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    usuario: { type: Schema.Types.ObjectId, ref: "User" },
    rol: { type: String },
    titulo: { type: String, required: true },
    mensaje: { type: String, required: true },
    tipo: { type: String, default: "general" },
    leida: { type: Boolean, default: false },
    fechaCreacion: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Notification = models.Notification || model<INotification>("Notification", NotificationSchema);

export default Notification;