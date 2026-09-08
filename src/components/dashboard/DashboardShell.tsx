"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Receipt,
  BarChart3,
  Bell,
  Users,
  Home
} from "lucide-react";
import { classNames } from "@/utils/helpers";

export default function DashboardShell({
  rol,
  children
}: {
  rol: "admin" | "vendedor";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = `/${rol}`;

  const links =
    rol === "admin"
      ? [
          { href: base, label: "Resumen", icono: LayoutDashboard },
          { href: `${base}/bonos`, label: "Bonos", icono: Ticket },
          { href: `${base}/ventas`, label: "Ventas", icono: Receipt },
          { href: `${base}/reportes`, label: "Reportes", icono: BarChart3 },
          { href: `${base}/usuarios`, label: "Usuarios", icono: Users },
          { href: `${base}/notificaciones`, label: "Notificaciones", icono: Bell }
        ]
      : [
          { href: base, label: "Resumen", icono: LayoutDashboard },
          { href: `${base}/bonos`, label: "Mis bonos", icono: Ticket },
          { href: `${base}/ventas`, label: "Mis ventas", icono: Receipt }
        ];

  return (
    <div className="container-page flex gap-6 py-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <nav className="sticky top-24 space-y-1">
          {links.map((l) => {
            const Icono = l.icono;
            const activo = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={classNames(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activo
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-brand-50 hover:text-brand-800"
                )}
              >
                <Icono className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            <Home className="h-4 w-4" />
            Volver al sitio
          </Link>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Navegación móvil */}
        <nav className="mb-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
          {links.map((l) => {
            const activo = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={classNames(
                  "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activo
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-brand-50"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </div>
  );
}