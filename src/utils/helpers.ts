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