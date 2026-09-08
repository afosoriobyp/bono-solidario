import mongoose, { Schema, models, model } from "mongoose";

export interface ICarrito {
  _id?: mongoose.Types.ObjectId;
  usuario: mongoose.Types.ObjectId | string;
  items: {
    _id?: mongoose.Types.ObjectId;
    bonoId: mongoose.Types.ObjectId | string;
    cantidad: number;
  }[];
  fechaActualizacion: Date;
}

const CarritoSchema = new Schema<ICarrito>({
  usuario: { type: Schema.Types.ObjectId, ref: "User", unique: true },
  items: [
    {
      bonoId: { type: Schema.Types.ObjectId, ref: "Bono", required: true },
      cantidad: { type: Number, default: 1, min: 1 }
    }
  ],
  fechaActualizacion: { type: Date, default: Date.now }
});

const Carrito = models.Carrito || model<ICarrito>("Carrito", CarritoSchema);

export default Carrito;