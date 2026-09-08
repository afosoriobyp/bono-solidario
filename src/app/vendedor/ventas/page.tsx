import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { ROLES } from "@/utils/constants";
import DashboardShell from "@/components/dashboard/DashboardShell";
import VentasTable from "@/components/dashboard/VentasTable";

export const dynamic = "force-dynamic";

export default async function VendedorVentasPage() {
  const user = await getSessionUser();
  if (!user || user.rol !== ROLES.VENDEDOR) redirect("/login");

  return (
    <DashboardShell rol="vendedor">
      <VentasTable endpoint="/api/vendedor/ventas" />
    </DashboardShell>
  );
}