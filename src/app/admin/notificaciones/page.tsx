import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { ROLES } from "@/utils/constants";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AdminNotificaciones from "@/components/dashboard/AdminNotificaciones";

export const dynamic = "force-dynamic";

export default async function AdminNotificacionesPage() {
  const user = await getSessionUser();
  if (!user || user.rol !== ROLES.ADMIN) redirect("/login");

  return (
    <DashboardShell rol="admin">
      <AdminNotificaciones />
    </DashboardShell>
  );
}