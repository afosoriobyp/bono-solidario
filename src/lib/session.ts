import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROLES } from "@/utils/constants";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRol(roles: string[]) {
  const user = await requireAuth();
  if (!user.rol || !roles.includes(user.rol)) {
    if (user.rol === ROLES.ADMIN) redirect("/admin");
    if (user.rol === ROLES.VENDEDOR) redirect("/vendedor");
    redirect("/");
  }
  return user;
}