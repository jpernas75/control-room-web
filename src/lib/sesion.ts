import { auth } from "./auth";
import type { Sesion } from "@/domain/acceso";

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
