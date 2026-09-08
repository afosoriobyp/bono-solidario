import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { ROLES } from "@/utils/constants";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AdminBonos from "@/components/dashboard/AdminBonos";

export const dynamic = "force-dynamic";

export default async function AdminBonosPage() {
  const user = await getSessionUser();
  if (!user || !["admin", "vendedor"].includes(user.rol || "")) redirect("/login");

  return (
    <DashboardShell rol={user.rol === "admin" ? "admin" : "vendedor"}>
      <AdminBonos rol={user.rol} />
    </DashboardShell>
  );
}