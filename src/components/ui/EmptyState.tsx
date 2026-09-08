import { Inbox } from "lucide-react";

export default function EmptyState({
  titulo,
  descripcion,
  accion
}: {
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        <Inbox className="h-6 w-6" />
      </span>
      <h3 className="font-semibold text-slate-800">{titulo}</h3>
      {descripcion && <p className="max-w-sm text-sm text-slate-500">{descripcion}</p>}
      {accion}
    </div>
  );
}