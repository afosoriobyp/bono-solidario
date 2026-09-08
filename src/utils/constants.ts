export const ROLES = {
  ADMIN: "admin",
  VENDEDOR: "vendedor",
  USUARIO: "usuario"
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

export const ESTADOS_BONO = {
  ACTIVO: "activo",
  INACTIVO: "inactivo",
  AGOTADO: "agotado"
} as const;

export const ESTADOS_VENTA = {
  PENDIENTE: "pendiente",
  PAGADO: "pagado",
  CANCELADO: "cancelado"
} as const;

export const METODOS_PAGO = {
  TRANSFERENCIA: "transferencia",
  TARJETA: "tarjeta",
  EFECTIVO: "efectivo"
} as const;

export const METODOS_PAGO_LABEL: Record<string, string> = {
  transferencia: "Transferencia bancaria",
  tarjeta: "Tarjeta de crédito/débito",
  efectivo: "Efectivo"
};

export const ESTADOS_BONO_LABEL: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  agotado: "Agotado"
};

export const ESTADOS_VENTA_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado"
};

export const ROLES_LABEL: Record<string, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
  usuario: "Usuario"
};