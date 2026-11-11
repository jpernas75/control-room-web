import * as XLSX from "xlsx";
import type { Centro } from "@/domain/centros";
import { leerFilas, planImportExcel, resumirExcel, type DatosPreventivo } from "@/domain/plan-excel";
import { planImportJson, resumirJson } from "@/domain/plan-json";
import type { DatosCr, LineaConocida } from "@/domain/types";
import { prisma } from "./prisma";

function conocida(row: {
  id: string;
  origen: "PREVENTIVO" | "CONTROL_ROOM";
  presencia: "ACTIVA" | "DESHABILITADA" | "ALERTA";
  expedienteId: string | null;
  vin: string;
  fechaIso: string;
  cuenta: string;
  vco: boolean;
}): LineaConocida {
  return {
    id: row.id,
    origen: row.origen,
    presencia: row.presencia,
    expedienteId: row.expedienteId,
    vin: row.vin,
    fechaIso: row.fechaIso || null,
    cuenta: row.cuenta || null,
    vco: row.vco,
  };
}

function camposCr(d: DatosCr) {
  return {
    origen: "CONTROL_ROOM" as const,
    presencia: "ACTIVA" as const,
    expedienteId: d.expedienteId,
    vin: d.vin,
    cliente: d.cliente,
    matricula: d.matricula,
    modelo: d.modelo,
    km: d.km,
    prediagnostico: d.prediagnostico,
    fase: d.fase,
    estadoIcss: d.estadoIcss,
    fechaIso: d.fechaIso,
    abierto: d.abierto,
    pago: d.pago,
    cuenta: d.cuenta,
    vco: d.vco,
    orId: d.or?.id ?? "",
    orNumero: d.or?.numero ?? "",
    orEstado: d.or?.estado ?? "",
    orUrl: d.or?.url ?? "",
    orFecha: d.or?.fecha ?? "",
    orFechaCita: d.or?.fechaCita ?? "",
    orFechaEntrega: d.or?.fechaEntrega ?? "",
    orCita: d.or?.cita ?? false,
  };
}

async function idCentro(nombre: Centro): Promise<string | null> {
  if (nombre === "Sin centro") return null;
  const centro = await prisma.centro.findUnique({ where: { nombre } });
  return centro?.id ?? null;
}

export async function previsualizarJson(payload: unknown) {
  const lineas = await prisma.linea.findMany();
  const plan = planImportJson(payload, lineas.map(conocida));
  if (!plan.ok) return plan;
  return { ok: true as const, resumen: resumirJson(plan.acciones) };
}

export async function aplicarJson(payload: unknown) {
  const lineas = await prisma.linea.findMany();
  const plan = planImportJson(payload, lineas.map(conocida));
  if (!plan.ok) return plan;
  await prisma.$transaction(async (tx) => {
    for (const accion of plan.acciones) {
      if (accion.tipo === "deshabilitar") {
        await tx.linea.update({ where: { id: accion.lineaId }, data: { presencia: "DESHABILITADA" } });
        continue;
      }
      const datos = accion.datos;
      const base = camposCr(datos);
      const centroId = await idCentro(datos.centroResuelto);
      if (accion.tipo === "upsert_cr" && !accion.lineaId) {
        await tx.linea.create({ data: { ...base, centroId, centroManual: false } });
        continue;
      }
      if (accion.tipo === "upsert_cr" || accion.tipo === "convertir") {
        const id = accion.tipo === "convertir" ? accion.lineaId : accion.lineaId!;
        const actual = await tx.linea.findUnique({ where: { id } });
        await tx.linea.update({
          where: { id },
          data: actual?.centroManual ? base : { ...base, centroId },
        });
        continue;
      }
      const prev = await tx.linea.findUnique({ where: { id: accion.preventivoId } });
      await tx.linea.update({
        where: { id: accion.crId },
        data: {
          ...base,
          centroId: prev?.centroManual ? prev.centroId : centroId,
          centroManual: Boolean(prev?.centroManual),
          comentario: prev?.comentario || undefined,
          comentarioUserId: prev?.comentario ? prev.comentarioUserId : undefined,
          comentarioAt: prev?.comentario ? prev.comentarioAt : undefined,
          fechaPrevista: prev?.fechaPrevista ?? undefined,
        },
      });
      await tx.linea.delete({ where: { id: accion.preventivoId } });
    }
  });
  const resumen = resumirJson(plan.acciones);
  await prisma.importBatch.create({ data: { tipo: "JSON", resumen } });
  return { ok: true as const, resumen };
}

function camposPreventivo(d: DatosPreventivo, centroId: string | null) {
  return {
    vin: d.vin,
    cliente: d.customer,
    trigger: d.trigger,
    obs: d.obs,
    dealer: d.dealer,
    centroId,
  };
}

export async function previsualizarExcel(buffer: Buffer) {
  const leido = leerLibro(buffer);
  if (!leido.ok) return leido;
  const lineas = await prisma.linea.findMany();
  const acciones = planImportExcel(leido.filas, lineas.map(conocida));
  return { ok: true as const, resumen: resumirExcel(acciones), aviso: leido.aviso, hoja: leido.hoja };
}

export async function aplicarExcel(buffer: Buffer) {
  const leido = leerLibro(buffer);
  if (!leido.ok) return leido;
  const lineas = await prisma.linea.findMany();
  const acciones = planImportExcel(leido.filas, lineas.map(conocida));
  await prisma.$transaction(async (tx) => {
    for (const accion of acciones) {
      if (accion.tipo === "alerta_preventivo") {
        await tx.linea.update({ where: { id: accion.lineaId }, data: { presencia: "ALERTA" } });
        continue;
      }
      if (accion.tipo === "retirar_preventivo") {
        await tx.linea.delete({ where: { id: accion.lineaId } });
        continue;
      }
      const centroId = await idCentro(accion.datos.centroResuelto);
      if (accion.tipo === "crear_preventivo") {
        await tx.linea.create({
          data: { ...camposPreventivo(accion.datos, centroId), origen: "PREVENTIVO", presencia: "ACTIVA", centroManual: false },
        });
        continue;
      }
      const actual = await tx.linea.findUnique({ where: { id: accion.lineaId } });
      const datos = camposPreventivo(accion.datos, centroId);
      await tx.linea.update({
        where: { id: accion.lineaId },
        data: {
          cliente: datos.cliente,
          trigger: datos.trigger,
          obs: datos.obs,
          dealer: datos.dealer,
          presencia: "ACTIVA",
          ...(actual?.centroManual ? {} : { centroId: datos.centroId }),
        },
      });
    }
  });
  const resumen = resumirExcel(acciones);
  await prisma.importBatch.create({ data: { tipo: "EXCEL", resumen: { ...resumen, hoja: leido.hoja, aviso: leido.aviso } } });
  return { ok: true as const, resumen, aviso: leido.aviso, hoja: leido.hoja };
}

function leerLibro(buffer: Buffer) {
  const book = XLSX.read(buffer, { type: "buffer" });
  const hojas = book.SheetNames.map((nombre) => ({
    nombre,
    filas: XLSX.utils.sheet_to_json(book.Sheets[nombre], { header: 1, raw: false, defval: "" }) as unknown[][],
  }));
  return leerFilas(hojas);
}
