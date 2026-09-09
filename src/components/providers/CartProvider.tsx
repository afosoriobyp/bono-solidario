"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

export type CarritoItem = {
  bonoId: string;
  cantidad: number;
  titulo?: string;
  valor?: number;
  imagen?: string;
  stock?: number | null;
  numeracion?: string | null;
  numero?: string | null;
};

type CarritoContextType = {
  items: CarritoItem[];
  totalItems: number;
  subtotal: number;
  abierto: boolean;
  cargando: boolean;
  abrir: () => void;
  cerrar: () => void;
  agregar: (bono: CarritoItem) => Promise<void>;
  actualizarCantidad: (bonoId: string, cantidad: number) => Promise<void>;
  actualizarNumero: (bonoId: string, numero: string | null) => Promise<void>;
  eliminar: (bonoId: string) => Promise<void>;
  vaciar: () => Promise<void>;
};

const CarritoContext = createContext<CarritoContextType | null>(null);

export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de CartProvider");
  return ctx;
}

function mapearItem(i: any): CarritoItem {
  return {
    bonoId: i.bonoId._id.toString(),
    cantidad: i.cantidad,
    titulo: i.bonoId.titulo,
    valor: i.bonoId.valor,
    imagen: i.bonoId.imagen,
    stock: i.bonoId.stock ?? null,
    numeracion: i.bonoId.numeracion ?? null,
    numero: i.numero ?? null
  };
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/carrito")
        .then((r) => r.json())
        .then(async (data) => {
          const serverItems = data.carrito?.items || [];
          const localRaw = localStorage.getItem("carrito");
          let localItems: CarritoItem[] = [];
          if (localRaw) {
            try {
              localItems = JSON.parse(localRaw);
            } catch {
              localItems = [];
            }
          }

          // Migrar carrito local al servidor si el servidor está vacío
          if (serverItems.length === 0 && localItems.length > 0) {
            for (const item of localItems) {
              await fetch("/api/carrito", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  bonoId: item.bonoId,
                  cantidad: item.cantidad,
                  numero: item.numero || undefined
                })
              }).catch(() => {});
            }
            const res2 = await fetch("/api/carrito");
            const data2 = await res2.json();
            setItems((data2.carrito?.items || []).map(mapearItem));
            localStorage.removeItem("carrito");
            return;
          }

          setItems(serverItems.map(mapearItem));
        })
        .catch(() => {});
    } else {
      const local = localStorage.getItem("carrito");
      if (!local) return;
      let parsed: CarritoItem[] = [];
      try {
        parsed = JSON.parse(local);
      } catch {
        parsed = [];
      }
      setItems(parsed);

      // Enriquecer items antiguos sin datos del bono (titulo/valor/imagen/numeracion)
      const faltantes = parsed.filter((i) => i.valor == null || !i.titulo || i.numeracion == null);
      if (faltantes.length > 0) {
        Promise.all(
          faltantes.map((i) =>
            fetch(`/api/bonos/${i.bonoId}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => (d?.bono ? { bonoId: i.bonoId, bono: d.bono } : null))
              .catch(() => null)
          )
        ).then((resultados) => {
          if (!resultados.some(Boolean)) return;
          setItems((prev) =>
            prev.map((item) => {
              const r = resultados.find((x) => x && x.bonoId === item.bonoId);
              if (!r) return item;
              return {
                ...item,
                titulo: item.titulo || r.bono.titulo,
                valor: item.valor ?? r.bono.valor,
                imagen: item.imagen || r.bono.imagen,
                stock: item.stock ?? r.bono.stock ?? null,
                numeracion: item.numeracion ?? r.bono.numeracion ?? null
              };
            })
          );
        });
      }
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) {
      localStorage.setItem("carrito", JSON.stringify(items));
    }
  }, [items, session?.user?.id]);

  const agregar = useCallback(
    async (bono: CarritoItem) => {
      setCargando(true);
      try {
        if (session?.user?.id) {
          const res = await fetch("/api/carrito", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bonoId: bono.bonoId, cantidad: bono.cantidad || 1 })
          });
          if (!res.ok) throw new Error("No se pudo agregar");
          const data = await res.json();
          setItems(data.carrito.items.map(mapearItem));
        } else {
          setItems((prev) => {
            const existente = prev.find((i) => i.bonoId === bono.bonoId);
            if (existente) {
              // Bonos numerados: siempre 1 unidad (cada número es único)
              const cantidad = bono.numeracion ? 1 : existente.cantidad + (bono.cantidad || 1);
              return prev.map((i) =>
                i.bonoId === bono.bonoId
                  ? { ...i, cantidad, numeracion: i.numeracion ?? bono.numeracion ?? null }
                  : i
              );
            }
            return [...prev, { ...bono, cantidad: bono.cantidad || 1 }];
          });
        }
      } finally {
        setCargando(false);
      }
    },
    [session?.user?.id]
  );

  const actualizarCantidad = useCallback(
    async (bonoId: string, cantidad: number) => {
      if (session?.user?.id) {
        setCargando(true);
        try {
          const res = await fetch("/api/carrito", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bonoId, cantidad })
          });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setItems(data.carrito.items.map(mapearItem));
        } catch {
        } finally {
          setCargando(false);
        }
      } else {
        if (cantidad <= 0) {
          setItems((prev) => prev.filter((i) => i.bonoId !== bonoId));
        } else {
          setItems((prev) => prev.map((i) => (i.bonoId === bonoId ? { ...i, cantidad } : i)));
        }
      }
    },
    [session?.user?.id]
  );

  const actualizarNumero = useCallback(
    async (bonoId: string, numero: string | null) => {
      if (session?.user?.id) {
        setCargando(true);
        try {
          const res = await fetch("/api/carrito", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bonoId, numero })
          });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setItems(data.carrito.items.map(mapearItem));
        } catch {
        } finally {
          setCargando(false);
        }
      } else {
        setItems((prev) => prev.map((i) => (i.bonoId === bonoId ? { ...i, numero } : i)));
      }
    },
    [session?.user?.id]
  );

  const eliminar = useCallback(
    async (bonoId: string) => {
      if (session?.user?.id) {
        const res = await fetch("/api/carrito", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bonoId })
        });
        if (res.ok) {
          const data = await res.json();
          setItems((data.carrito?.items || []).map(mapearItem));
        }
      } else {
        setItems((prev) => prev.filter((i) => i.bonoId !== bonoId));
      }
    },
    [session?.user?.id]
  );

  const vaciar = useCallback(async () => {
    if (session?.user?.id) {
      await fetch("/api/carrito", { method: "DELETE" });
    }
    setItems([]);
  }, [session?.user?.id]);

  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);
  const subtotal = items.reduce((s, i) => s + (i.valor || 0) * i.cantidad, 0);

  const value = useMemo(
    () => ({
      items,
      totalItems,
      subtotal,
      abierto,
      cargando,
      abrir: () => setAbierto(true),
      cerrar: () => setAbierto(false),
      agregar,
      actualizarCantidad,
      actualizarNumero,
      eliminar,
      vaciar
    }),
    [
      items,
      totalItems,
      subtotal,
      abierto,
      cargando,
      agregar,
      actualizarCantidad,
      actualizarNumero,
      eliminar,
      vaciar
    ]
  );

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
}