"use client";

import { Suspense } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { HeartHandshake } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/providers/ToastProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password
    });

    setCargando(false);

    if (res?.error) {
      setError("Credenciales inválidas o cuenta desactivada.");
      toast("No se pudo iniciar sesión", "error");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl") || "/";
    router.push(callbackUrl);
    router.refresh();
    toast("¡Bienvenido de nuevo!", "success");
  }

  return (
    <div className="container-page flex items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <HeartHandshake className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-slate-500">Accede a tu cuenta de Bono Solidario</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={cargando} className="btn-primary w-full">
            {cargando ? <Spinner size={18} /> : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-brand-700 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-page py-16 text-center text-slate-500">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}