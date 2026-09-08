import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { ROLES } from "@/utils/constants";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AdminUsuarios from "@/components/dashboard/AdminUsuarios";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const user = await getSessionUser();
  if (!user || user.rol !== ROLES.ADMIN) redirect("/login");

  return (
    <DashboardShell rol="admin">
      <AdminUsuarios />
    </DashboardShell>
  );
}