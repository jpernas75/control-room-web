"use server";

import { revalidatePath } from "next/cache";
import { CENTROS, type CentroNombre } from "@/domain/centros";
import { puedeEditar } from "@/domain/acceso";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";

async function lineaEditable(id: string) {
  const sesion = await sesionActual();
  if (!sesion) return null;
  const linea = await prisma.linea.findUnique({ where: { id } });
  if (!linea || !puedeEditar(sesion, linea)) return null;
  return { sesion, linea };
}

export async function guardarComentario(id: string, formData: FormData) {
  const ctx = await lineaEditable(id);
  if (!ctx) return;
  await prisma.linea.update({
    where: { id },
    data: {
      comentario: String(formData.get("comentario") ?? ""),
      comentarioUserId: ctx.sesion.id,
      comentarioAt: new Date(),
    },
  });
  revalidatePath(`/lineas/${id}`);
  revalidatePath("/");
}

export async function marcarDesplazado(id: string, formData: FormData) {
  const ctx = await lineaEditable(id);
  if (!ctx || ctx.linea.origen !== "PREVENTIVO") return;
  await prisma.linea.update({
    where: { id },
    data: { desplazado: formData.get("desplazado") === "1" },
  });
  revalidatePath(`/lineas/${id}`);
  revalidatePath("/");
}

export async function cambiarCentro(id: string, formData: FormData) {
  const ctx = await lineaEditable(id);
  if (!ctx) return;
  const hacia = String(formData.get("centro") ?? "");
  if (!CENTROS.includes(hacia as CentroNombre)) return;
  const destino = await prisma.centro.findUnique({ where: { nombre: hacia } });
  if (!destino) return;
  const desde = ctx.linea.centroId
    ? (await prisma.centro.findUnique({ where: { id: ctx.linea.centroId } }))?.nombre ?? "Sin centro"
    : "Sin centro";
  await prisma.$transaction([
    prisma.linea.update({ where: { id }, data: { centroId: destino.id, centroManual: true } }),
    prisma.cambioCentro.create({ data: { lineaId: id, userId: ctx.sesion.id, desde, hacia } }),
  ]);
  revalidatePath(`/lineas/${id}`);
  revalidatePath("/");
}

export async function guardarFechaPrevista(id: string, formData: FormData) {
  const ctx = await lineaEditable(id);
  if (!ctx || ctx.linea.orFechaCita) return;
  const valor = String(formData.get("fecha") ?? "").trim();
  if (valor && !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return;
  await prisma.linea.update({ where: { id }, data: { fechaPrevista: valor || null } });
  revalidatePath(`/lineas/${id}`);
  revalidatePath("/calendario");
}
