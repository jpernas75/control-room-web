import { resolverCentro, type Centro } from "./centros";
import type { LineaConocida } from "./types";

export type FilaExcel = { vin: string; sede: string; customer: string; trigger: string; obs: string; dealer: string };
export type DatosPreventivo = FilaExcel & { centroResuelto: Centro };
export type AccionExcel =
  | { tipo: "crear_preventivo"; datos: DatosPreventivo }
  | { tipo: "actualizar_preventivo"; lineaId: string; datos: DatosPreventivo }
  | { tipo: "reactivar_preventivo"; lineaId: string; datos: DatosPreventivo }
  | { tipo: "alerta_preventivo"; lineaId: string }
  | { tipo: "retirar_preventivo"; lineaId: string };

export function elegirHoja(nombres: string[]): { nombre: string; aviso: string | null } {
  let bestNombre = "";
  let bestFecha = "";
  let bestIndex = -1;
  nombres.forEach((nombre, index) => {
    const fecha = nombre.match(/\d{8}/)?.[0];
    if (!fecha) return;
    if (bestIndex < 0 || fecha > bestFecha || (fecha === bestFecha && index > bestIndex)) {
      bestNombre = nombre;
      bestFecha = fecha;
      bestIndex = index;
    }
  });
  if (bestIndex >= 0) return { nombre: bestNombre, aviso: null };
  return {
    nombre: nombres[nombres.length - 1] ?? "",
    aviso: "Ninguna pestaña trae fecha en el nombre; se usa la última.",
  };
}

function celda(v: unknown): string {
  return String(v ?? "").trim();
}

export function leerFilas(
  hojas: { nombre: string; filas: unknown[][] }[],
): { ok: true; hoja: string; aviso: string | null; filas: FilaExcel[] } | { ok: false; error: string } {
  const elegida = elegirHoja(hojas.map((h) => h.nombre));
  const hoja = hojas.find((h) => h.nombre === elegida.nombre);
  const tabla = hoja?.filas ?? [];
  const header = (tabla[0] ?? []).map((c) => celda(c).toLowerCase());
  const col = (nombre: string) => header.indexOf(nombre);
  if (col("vin") < 0) return { ok: false, error: "El Excel no tiene columna VIN" };
  const porVin = new Map<string, FilaExcel>();
  for (const row of tabla.slice(1)) {
    const vin = celda(row[col("vin")]).toUpperCase().replace(/\s+/g, "");
    if (!vin) continue;
    const tomar = (nombre: string) => (col(nombre) < 0 ? "" : celda(row[col(nombre)]));
    porVin.set(vin, {
      vin,
      sede: tomar("sede"),
      customer: tomar("customer"),
      trigger: tomar("trigger"),
      obs: tomar("obs"),
      dealer: tomar("dealer"),
    });
  }
  return { ok: true, hoja: elegida.nombre, aviso: elegida.aviso, filas: [...porVin.values()] };
}

function datosDe(fila: FilaExcel): DatosPreventivo {
  return {
    ...fila,
    centroResuelto: resolverCentro({ centro2: null, numeroOr: null, cuenta: null, sedeExcel: fila.sede }),
  };
}

export function planImportExcel(filas: FilaExcel[], lineas: LineaConocida[]): AccionExcel[] {
  const vins = new Set(filas.map((f) => f.vin));
  const vco = new Set(lineas.filter((l) => l.origen === "CONTROL_ROOM" && l.vco).map((l) => l.vin));
  const preventivos = new Map(lineas.filter((l) => l.origen === "PREVENTIVO").map((l) => [l.vin, l]));
  const acciones: AccionExcel[] = [];
  for (const fila of filas) {
    const prev = preventivos.get(fila.vin);
    if (vco.has(fila.vin)) {
      if (prev) acciones.push({ tipo: "retirar_preventivo", lineaId: prev.id });
      continue;
    }
    if (prev?.presencia === "ALERTA") acciones.push({ tipo: "reactivar_preventivo", lineaId: prev.id, datos: datosDe(fila) });
    else if (prev) acciones.push({ tipo: "actualizar_preventivo", lineaId: prev.id, datos: datosDe(fila) });
    else acciones.push({ tipo: "crear_preventivo", datos: datosDe(fila) });
  }
  for (const prev of preventivos.values()) {
    if (prev.presencia === "ACTIVA" && !vins.has(prev.vin)) acciones.push({ tipo: "alerta_preventivo", lineaId: prev.id });
  }
  return acciones;
}

export function resumirExcel(acciones: AccionExcel[]): { nuevos: number; actualizan: number; alertas: number } {
  return {
    nuevos: acciones.filter((a) => a.tipo === "crear_preventivo").length,
    actualizan: acciones.filter((a) => a.tipo === "actualizar_preventivo" || a.tipo === "reactivar_preventivo").length,
    alertas: acciones.filter((a) => a.tipo === "alerta_preventivo").length,
  };
}
