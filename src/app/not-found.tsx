import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <SearchX className="h-16 w-16 text-slate-300" />
      <h1 className="mt-6 text-4xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="mt-3 text-slate-500">
        La página que buscas no existe o fue movida.
      </p>
      <Link href="/" className="btn-primary mt-6">Volver al inicio</Link>
    </div>
  );
}