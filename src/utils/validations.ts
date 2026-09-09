import { z } from "zod";

export const emailSchema = z.string().email("Email inválido");

export const passwordSchema = z
  .string()
  .min(6, "La contraseña debe tener al menos 6 caracteres");

export const registerSchema = z.object({
  nombre: z.string().min(2, "Ingrese un nombre válido"),
  email: emailSchema,
  password: passwordSchema,
  telefono: z.string().optional()
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es requerida")
});

export const bonoSchemaBase = z.object({
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  descripcion: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  valor: z.coerce.number().min(1, "El valor debe ser mayor a 0"),
  fechaEmision: z.string().min(1, "La fecha de emisión es requerida"),
  fechaVencimiento: z.string().optional().nullable(),
  imagen: z.string().optional().nullable(),
  estado: z.enum(["activo", "inactivo"]).default("activo"),
  stock: z.coerce.number().int().min(0).optional().nullable(),
  vendidoPor: z.string().optional().nullable()
});

export const bonoSchema = bonoSchemaBase.refine(
  (data) =>
    !data.fechaVencimiento ||
    new Date(data.fechaVencimiento) >= new Date(data.fechaEmision),
  { message: "La fecha de vencimiento no puede ser anterior a la emisión", path: ["fechaVencimiento"] }
);

export const crearVentaSchema = z.object({
  items: z
    .array(
      z.object({
        bonoId: z.string().min(1),
        cantidad: z.coerce.number().int().min(1)
      })
    )
    .min(1, "Debe agregar al menos un bono"),
  metodoPago: z.enum(["transferencia", "tarjeta", "efectivo"]).optional(),
  comprobantePago: z.string().optional().nullable(),
  datosComprador: z
    .object({
      nombre: z.string().min(2, "Ingrese el nombre del comprador").optional(),
      email: z.string().email("Email del comprador inválido").optional(),
      telefono: z.string().optional()
    })
    .optional(),
  datosTransferencia: z
    .object({
      banco: z.string().optional(),
      numeroCuenta: z.string().optional(),
      titular: z.string().optional(),
      referencia: z.string().optional()
    })
    .optional()
});

export const carritoItemSchema = z.object({
  bonoId: z.string().min(1),
  cantidad: z.coerce.number().int().min(1).default(1)
});