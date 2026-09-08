export function apiError(error: unknown, fallback = "Ocurrió un error inesperado") {
  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ error: fallback }, { status: 400 });
}

export function unauthorized() {
  return Response.json({ error: "No autorizado" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "Acceso denegado" }, { status: 403 });
}

export function notFound(message = "Recurso no encontrado") {
  return Response.json({ error: message }, { status: 404 });
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Error desconocido";
}