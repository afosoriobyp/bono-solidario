"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { HeartHandshake } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/providers/ToastProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ nombre: "", email: "", password: "", telefono: "" });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrarse");
        toast("Error al registrarse", "error");
        return;
      }

      // Auto login
      const login = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password
      });

      if (login?.error) {
        router.push("/login");
      } else {
        router.push("/");
      }
      router.refresh();
      toast("¡Cuenta creada con éxito!", "success");
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="container-page flex items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <HeartHandshake className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Crear cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">Únete a Bono Solidario</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label htmlFor="nombre" className="label">Nombre completo</label>
            <input
              id="nombre"
              required
              minLength={2}
              value={form.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              className="input"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="input"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="telefono" className="label">Teléfono (opcional)</label>
            <input
              id="telefono"
              value={form.telefono}
              onChange={(e) => update("telefono", e.target.value)}
              className="input"
              placeholder="+57 300 000 0000"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="input"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button type="submit" disabled={cargando} className="btn-primary w-full">
            {cargando ? <Spinner size={18} /> : "Registrarse"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}