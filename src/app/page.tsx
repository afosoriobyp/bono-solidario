import Link from "next/link";
import { HeartHandshake, ShieldCheck, Truck, ArrowRight, Sparkles } from "lucide-react";
import { listarBonos } from "@/services/bonoService";
import BonoCard from "@/components/bonos/BonoCard";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  let bonos: any[] = [];
  try {
    const data = await listarBonos({ soloActivos: true, limit: 8 });
    bonos = data.bonos;
  } catch (e) {
    console.error("Error cargando bonos:", e instanceof Error ? e.message : e);
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div className="container-page py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Bonos solidarios certificados
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Ayuda con un bono, genera un impacto real
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-100">
            Adquiere bonos solidarios y apoya proyectos sociales. Cada bono cuenta
            historias de cambio.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/bonos" className="btn bg-white text-brand-800 hover:bg-brand-50 focus:ring-white">
              Explorar bonos
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="btn border border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page grid gap-6 py-10 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" />
            <div>
              <h3 className="font-semibold text-slate-900">100% seguro</h3>
              <p className="text-sm text-slate-500">Pagos verificados y comprobantes oficiales.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HeartHandshake className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" />
            <div>
              <h3 className="font-semibold text-slate-900">Impacto directo</h3>
              <p className="text-sm text-slate-500">Tu compra apoya causas sociales reales.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" />
            <div>
              <h3 className="font-semibold text-slate-900">Entrega rápida</h3>
              <p className="text-sm text-slate-500">Recibe tu bono inmediatamente en tu correo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bonos destacados */}
      <section className="container-page py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Bonos destacados</h2>
            <p className="mt-1 text-slate-500">Selección de bonos disponibles para ti.</p>
          </div>
          <Link href="/bonos" className="btn-secondary">
            Ver todos
          </Link>
        </div>

        {bonos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
            Aún no hay bonos disponibles.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bonos.map((bono: any) => (
              <BonoCard key={bono._id.toString()} bono={bono} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}