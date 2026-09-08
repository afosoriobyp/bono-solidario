import type { Metadata } from "next";
import "@/app/globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import CartProvider from "@/components/providers/CartProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartSidebar from "@/components/carrito/CartSidebar";

export const metadata: Metadata = {
  title: {
    default: "Bono Solidario",
    template: "%s | Bono Solidario"
  },
  description:
    "Plataforma para la gestión y venta de bonos solidarios."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <CartSidebar />
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}