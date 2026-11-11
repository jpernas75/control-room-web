import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Cabecera } from "./Cabecera";

function fecha(d: Date | undefined) {
  if (!d) return "sin importar";
  return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Madrid" });
}

export async function Nav() {
  const sesion = await auth();
  if (!sesion?.user) return null;
  const [json, excel] = await Promise.all([
    prisma.importBatch.findFirst({ where: { tipo: "JSON" }, orderBy: { createdAt: "desc" } }),
    prisma.importBatch.findFirst({ where: { tipo: "EXCEL" }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <Cabecera
      nombre={sesion.user.name ?? ""}
      admin={sesion.user.role === "ADMIN"}
      json={fecha(json?.createdAt)}
      excel={fecha(excel?.createdAt)}
    />
  );
}
