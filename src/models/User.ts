import mongoose, { Schema, models, model } from "mongoose";
import { ROLES } from "@/utils/constants";

export interface IUser {
  _id?: mongoose.Types.ObjectId;
  nombre: string;
  email: string;
  password: string;
  rol: string;
  telefono?: string;
  activo: boolean;
  fechaCreacion: Date;
}

const UserSchema = new Schema<IUser>({
  nombre: { type: String, required: [true, "El nombre es requerido"], trim: true },
  email: {
    type: String,
    required: [true, "El email es requerido"],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: [true, "La contraseña es requerida"] },
  rol: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.USUARIO,
    required: true
  },
  telefono: { type: String, trim: true },
  activo: { type: Boolean, default: true },
  fechaCreacion: { type: Date, default: Date.now }
});

const User = models.User || model<IUser>("User", UserSchema);

export default User;