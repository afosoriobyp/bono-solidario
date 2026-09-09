import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { ROLES } from "@/utils/constants";
import DashboardShell from "@/components/dashboard/DashboardShell";
import VentasTable from "@/components/dashboard/VentasTable";

export const dynamic = "force-dynamic";

export default async function AdminVentasPage() {
  const user = await getSessionUser();
  if (!user || user.rol !== ROLES.ADMIN) redirect("/login");

  return (
    <DashboardShell rol="admin">
      <VentasTable endpoint="/api/admin/ventas" />
    </DashboardShell>
  );
}