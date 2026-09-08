import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { ROLES } from "@/utils/constants";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AdminBonos from "@/components/dashboard/AdminBonos";

export const dynamic = "force-dynamic";

export default async function VendedorBonosPage() {
  const user = await getSessionUser();
  if (!user || user.rol !== ROLES.VENDEDOR) redirect("/login");

  return (
    <DashboardShell rol="vendedor">
      <AdminBonos rol="vendedor" />
    </DashboardShell>
  );
}