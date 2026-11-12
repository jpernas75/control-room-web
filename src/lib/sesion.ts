import { auth } from "./auth";
import { prisma } from "./prisma";
import type { Sesion } from "@/domain/acceso";

export const CUENTA_ADMINISTRADOR = "admin";

export async function esCuentaAdministrador(): Promise<boolean> {
  const s = await auth();
  if (!s?.user?.id || s.user.role !== "ADMIN") return false;
  const user = await prisma.user.findUnique({ where: { id: s.user.id }, select: { username: true } });
  return user?.username === CUENTA_ADMINISTRADOR;
}

export async function sesionActual(): Promise<(Sesion & { id: string; name: string }) | null> {
  const s = await auth();
  if (!s?.user?.id || (s.user.role !== "ADMIN" && s.user.role !== "CENTRO")) return null;
  return {
    id: s.user.id,
    name: s.user.name ?? "",
    role: s.user.role,
    centroId: s.user.centroId,
  };
}
