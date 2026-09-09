export function formatCurrency(
  value: number,
  locale = "es-CO",
  currency = "COP"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0
  }).format(value);
}

export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

export function truncate(text: string, max = 100): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export function generateOrderId(): string {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BS-${now}-${rand}`;
}

export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Numeración de bonos ───────────────────────────────────────

export type Numeracion = "2" | "3" | "4" | null;

export const NUMERACION_LABEL: Record<string, string> = {
  "2": "00-99 (2 dígitos)",
  "3": "000-999 (3 dígitos)",
  "4": "0000-9999 (4 dígitos)"
};

export function rangoNumeracion(digitos: string | null | undefined): string[] | null {
  if (!digitos) return null;
  const n = Number(digitos);
  if (![2, 3, 4].includes(n)) return null;
  const max = Math.pow(10, n) - 1;
  const arr: string[] = [];
  for (let i = 0; i <= max; i++) arr.push(String(i).padStart(n, "0"));
  return arr;
}

export function numerosDisponibles(
  digitos: string | null | undefined,
  usados: (string | null | undefined)[] | undefined
): string[] {
  const rango = rangoNumeracion(digitos);
  if (!rango) return [];
  const set = new Set((usados || []).map((x) => String(x)));
  return rango.filter((x) => !set.has(x));
}

export function validarNumero(numero: string, digitos: string): boolean {
  const n = Number(digitos);
  return new RegExp(`^\\d{${n}}$`).test(numero);
}