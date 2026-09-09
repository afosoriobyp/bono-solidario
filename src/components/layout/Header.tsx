"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ShoppingCart, HeartHandshake, User, LogOut } from "lucide-react";
import { useCarrito } from "@/components/providers/CartProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ROLES_LABEL } from "@/utils/constants";

export default function Header() {
  const { data: session } = useSession();
  const { totalItems, abrir } = useCarrito();
  const { toast } = useToast();
  const pathname = usePathname();

  const dashboardHref =
    session?.user?.rol === "admin"
      ? "/admin"
      : session?.user?.rol === "vendedor"
      ? "/vendedor"
      : "/perfil";

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/bonos", label: "Bonos" }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-slate-900">
            Bono<span className="text-brand-600">Solidario</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                pathname === l.href ? "text-brand-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={abrir}
            className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
            aria-label="Abrir carrito"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>

          {session?.user ? (
            <div className="flex items-center gap-2">
              <Link
                href={dashboardHref}
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:flex"
              >
                <User className="h-4 w-4" />
                {session.user.name?.split(" ")[0]}
                {session.user.rol && (
                  <span className="hidden rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-800 lg:inline">
                    {ROLES_LABEL[session.user.rol]}
                  </span>
                )}
              </Link>
              <button
                onClick={() => {
                  // Redirigir al mismo origen actual (evita saltar a localhost en producción)
                  const callbackUrl = `${window.location.origin}/`;
                  signOut({ callbackUrl }).then(() => toast("Sesión cerrada", "info"));
                }}
                className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-secondary hidden sm:inline-flex">
                Ingresar
              </Link>
              <Link href="/register" className="btn-primary">
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}