import Link from "next/link";
import { HeartHandshake, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <HeartHandshake className="h-4 w-4" />
            </span>
            <span className="font-bold text-slate-900">
              Bono<span className="text-brand-600">Solidario</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Plataforma para la gestión y venta de bonos solidarios. Tu apoyo hace la diferencia.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Enlaces</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/" className="hover:text-brand-700">Inicio</Link></li>
            <li><Link href="/bonos" className="hover:text-brand-700">Bonos disponibles</Link></li>
            <li><Link href="/login" className="hover:text-brand-700">Iniciar sesión</Link></li>
            <li><Link href="/register" className="hover:text-brand-700">Registrarse</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Contacto</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-600" />
              {process.env.ADMIN_EMAIL || "soporte@bonosolidario.com"}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-600" />
              +57 300 000 0000
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" />
              Colombia
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200 py-4">
        <p className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Bono Solidario. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}