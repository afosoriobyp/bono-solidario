import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import UserPerfil from "@/components/perfil/UserPerfil";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <UserPerfil user={user} />;
}