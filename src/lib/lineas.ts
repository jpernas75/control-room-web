import { fold } from "@/domain/centros";
import { puedeVer, type Sesion } from "@/domain/acceso";
import { situacion } from "@/domain/situacion";
import { prisma } from "./prisma";

export function hoyMadrid(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
}

export async function listarLineas(sesion: Sesion) {
  const filas = await prisma.linea.findMany({
    include: { centro: true, comentarioUser: true },
    orderBy: { updatedAt: "desc" },
  });
  const hoy = hoyMadrid();
  return filas
    .filter((fila) => puedeVer(sesion, fila))
    .map((fila) => ({
      ...fila,
      situacion: situacion({
        origen: fila.origen,
        presencia: fila.presencia,
        abierto: fila.abierto,
        estadoIcss: fila.estadoIcss,
        fase: fila.fase,
        tieneOr: Boolean(fila.orId || fila.orNumero || fila.orCita),
        orEntregada: fold(fila.orEstado) === "vehiculo entregado",
        fechaIso: fila.fechaIso || null,
        hoy,
      }),
    }));
}
