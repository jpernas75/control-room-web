import { resolverCentro } from "./centros";
import { esVco } from "./situacion";
import type { DatosCr, LineaConocida } from "./types";

export type AccionJson =
  | { tipo: "upsert_cr"; lineaId: string | null; datos: DatosCr }
  | { tipo: "convertir"; lineaId: string; datos: DatosCr }
  | { tipo: "fusionar"; preventivoId: string; crId: string; datos: DatosCr }
  | { tipo: "deshabilitar"; lineaId: string; expedienteId: string };

export type PlanJson =
  | { ok: true; acciones: AccionJson[]; period: { from: string; to: string } }
  | { ok: false; error: string };

type Payload = {
  cases: Record<string, unknown>[];
  period: { from: string; to: string };
  meta: { sources: Record<string, unknown>[] };
};

function texto(v: unknown): string {
  return String(v ?? "").trim();
}

function vinDe(v: unknown): string {
  return texto(v).toUpperCase().replace(/\s+/g, "");
}

function esPayload(v: unknown): v is Payload {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const period = o.period as Record<string, unknown> | undefined;
  const meta = o.meta as Record<string, unknown> | undefined;
  return Array.isArray(o.cases) && typeof period?.from === "string" && typeof period?.to === "string" && Array.isArray(meta?.sources);
}

function casoADatos(caso: Record<string, unknown>): DatosCr | null {
  const expedienteId = texto(caso.id);
  if (!expedienteId || texto(caso.tipo) !== "Control Room") return null;
  const fields = (caso.fields ?? {}) as Record<string, unknown>;
  const orRaw = caso.or_car as Record<string, unknown> | null | undefined;
  const or = orRaw
    ? {
        id: texto(orRaw.id),
        numero: texto(orRaw.numero),
        estado: texto(orRaw.estado),
        url: texto(orRaw.url),
        fecha: texto(orRaw.fecha),
        fechaCita: texto(orRaw.fecha_cita),
        fechaEntrega: texto(orRaw.fecha_entrega),
        cita: Boolean(orRaw.cita),
      }
    : null;
  const prediagnostico = texto(fields["Prediagnóstico"]);
  const cuenta = texto(caso.centro);
  return {
    expedienteId,
    vin: vinDe(fields.VIN),
    cliente: texto(fields.Cliente),
    matricula: texto(fields["Matrícula"]),
    modelo: texto(fields.modelo),
    km: texto(fields.Km),
    prediagnostico,
    fase: texto(fields.Fase),
    estadoIcss: texto(caso.estado),
    fechaIso: texto(caso.fecha_iso),
    abierto: Boolean(caso.open),
    pago: texto(fields.Pago),
    cuenta,
    centroResuelto: resolverCentro({
      centro2: texto(caso.centro2),
      numeroOr: or?.numero ?? "",
      cuenta,
      sedeExcel: null,
    }),
    vco: esVco(prediagnostico),
    or,
  };
}

function dentro(fechaIso: string | null, period: { from: string; to: string }): boolean {
  const dia = (fechaIso ?? "").slice(0, 10);
  return dia.length === 10 && dia >= period.from && dia <= period.to;
}

function cuentaOk(cuenta: string | null, sources: Record<string, unknown>[]): boolean {
  if (!cuenta) return false;
  return sources.some((s) => {
    const tipo = texto(s.tipo).toLowerCase();
    return texto(s.account) === cuenta && tipo.includes("control") && tipo.includes("room") && Number(s.error) === 0;
  });
}

export function planImportJson(payload: unknown, lineas: LineaConocida[]): PlanJson {
  if (!esPayload(payload)) return { ok: false, error: "El JSON no trae cases, period y meta.sources" };
  const datos = payload.cases.map(casoADatos).filter((d): d is DatosCr => d !== null);
  const porExpediente = new Map(lineas.filter((l) => l.expedienteId).map((l) => [l.expedienteId as string, l]));
  const preventivoPorVin = new Map(lineas.filter((l) => l.origen === "PREVENTIVO").map((l) => [l.vin, l]));
  const elegido = new Map<string, string>();
  const grupos = new Map<string, DatosCr[]>();
  for (const d of datos) {
    if (!d.vco || !d.vin) continue;
    const arr = grupos.get(d.vin) ?? [];
    arr.push(d);
    grupos.set(d.vin, arr);
  }
  for (const [vin, arr] of grupos) {
    if (!preventivoPorVin.has(vin)) continue;
    const best = arr.reduce((a, b) => (b.fechaIso >= a.fechaIso ? b : a));
    elegido.set(vin, best.expedienteId);
  }

  const acciones: AccionJson[] = [];
  const vistos = new Set<string>();
  for (const d of datos) {
    vistos.add(d.expedienteId);
    const prev = d.vin ? preventivoPorVin.get(d.vin) : undefined;
    const ya = porExpediente.get(d.expedienteId);
    if (prev && elegido.get(d.vin) === d.expedienteId && !ya) {
      acciones.push({ tipo: "convertir", lineaId: prev.id, datos: d });
      continue;
    }
    if (prev && elegido.get(d.vin) === d.expedienteId && ya) {
      acciones.push({ tipo: "fusionar", preventivoId: prev.id, crId: ya.id, datos: d });
      continue;
    }
    acciones.push({ tipo: "upsert_cr", lineaId: ya?.id ?? null, datos: d });
  }

  for (const l of lineas) {
    if (l.origen !== "CONTROL_ROOM" || !l.expedienteId || l.presencia === "DESHABILITADA") continue;
    if (vistos.has(l.expedienteId)) continue;
    if (!dentro(l.fechaIso, payload.period) || !cuentaOk(l.cuenta, payload.meta.sources)) continue;
    acciones.push({ tipo: "deshabilitar", lineaId: l.id, expedienteId: l.expedienteId });
  }
  return { ok: true, acciones, period: payload.period };
}

export function resumirJson(acciones: AccionJson[]): { entran: number; actualizan: number; deshabilitan: number } {
  return {
    entran: acciones.filter((a) => (a.tipo === "upsert_cr" && a.lineaId === null) || a.tipo === "convertir").length,
    actualizan: acciones.filter((a) => (a.tipo === "upsert_cr" && a.lineaId !== null) || a.tipo === "fusionar").length,
    deshabilitan: acciones.filter((a) => a.tipo === "deshabilitar").length,
  };
}
