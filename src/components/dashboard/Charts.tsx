"use client";

type Serie = { label: string; total: number };

const PALETA = ["#16a34a", "#15803d", "#4ade80", "#166534", "#86efac"];

export function BarChart({ data, height = 200 }: { data: Serie[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.length === 0 && (
        <p className="text-sm text-slate-400">Sin datos</p>
      )}
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="relative flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t bg-brand-600 transition-all hover:bg-brand-700"
              style={{ height: `${(d.total / max) * 100}%` }}
              title={`${d.label}: ${d.total.toLocaleString("es-CO")}`}
            />
          </div>
          <span className="text-[10px] text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HorizontalBarList({ data }: { data: { nombre: string; cantidad: number; ingresos: number }[] }) {
  const max = Math.max(...data.map((d) => d.cantidad), 1);

  return (
    <div className="space-y-3">
      {data.length === 0 && <p className="text-sm text-slate-400">Sin ventas en el periodo</p>}
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate font-medium text-slate-700">{d.nombre}</span>
            <span className="ml-2 shrink-0 text-slate-500">
              {d.cantidad} und · {d.ingresos.toLocaleString("es-CO")}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.cantidad / max) * 100}%`, background: PALETA[i % PALETA.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return <p className="text-sm text-slate-400">Sin datos</p>;

  const labels: Record<string, string> = {
    transferencia: "Transferencia",
    tarjeta: "Tarjeta",
    efectivo: "Efectivo",
    sin_definir: "Sin definir"
  };

  // SVG donut
  const radius = 60;
  const circunferencia = 2 * Math.PI * radius;
  let acumulado = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="22" />
        {entries.map(([key, valor], i) => {
          const frac = valor / total;
          const offset = acumulado * circunferencia;
          acumulado += frac;
          return (
            <circle
              key={key}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={PALETA[i % PALETA.length]}
              strokeWidth="22"
              strokeDasharray={`${frac * circunferencia} ${circunferencia}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
        })}
        <text x="70" y="75" textAnchor="middle" className="fill-slate-700 text-sm font-bold">
          {total}
        </text>
      </svg>
      <ul className="space-y-1 text-sm">
        {entries.map(([key, valor], i) => (
          <li key={key} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: PALETA[i % PALETA.length] }} />
            <span className="text-slate-600">{labels[key] || key}</span>
            <span className="font-medium text-slate-800">{valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}