import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { ROLES } from "@/utils/constants";
import DashboardShell from "@/components/dashboard/DashboardShell";
import VendedorResumen from "@/components/dashboard/VendedorResumen";

export const dynamic = "force-dynamic";

export default async function VendedorDashboardPage() {
  const user = await getSessionUser();
  if (!user || user.rol !== ROLES.VENDEDOR) redirect("/login");

  return (
    <DashboardShell rol="vendedor">
      <VendedorResumen />
    </DashboardShell>
  );
}