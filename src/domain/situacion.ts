import { fold } from "./centros";

export function esVco(prediagnostico: string | null | undefined): boolean {
  return fold(prediagnostico ?? "").includes("vco");
}

export type SituacionInput = {
  origen: "PREVENTIVO" | "CONTROL_ROOM";
  presencia: "ACTIVA" | "DESHABILITADA" | "ALERTA";
  abierto: boolean;
  estadoIcss: string;
  fase: string;
  tieneOr: boolean;
  orEntregada: boolean;
  fechaIso: string | null;
  hoy: string;
};

function dias(fechaIso: string | null, hoy: string): number {
  if (!fechaIso) return 0;
  const a = Date.parse(fechaIso.slice(0, 10) + "T00:00:00Z");
  const b = Date.parse(hoy.slice(0, 10) + "T00:00:00Z");
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.floor((b - a) / 86_400_000);
}

export function situacion(input: SituacionInput): { key: string; texto: string } {
  if (input.presencia === "DESHABILITADA") return { key: "deshabilitada", texto: "Ya no aparece en ICSS" };
  if (input.origen === "PREVENTIVO" && input.presencia === "ALERTA") return { key: "alerta", texto: "Salió de la lista" };
  if (input.origen === "PREVENTIVO") return { key: "preventivo", texto: "Preventivo" };
  if (input.abierto && input.orEntregada) return { key: "cerrar", texto: "Cerrar en ICSS" };
  const d = dias(input.fechaIso, input.hoy);
  if (input.abierto && !input.tieneOr && d > 7) return { key: "sinor", texto: `Sin OR · ${d} días` };
  if (input.abierto && fold(input.fase).includes("waiting for arrival")) {
    return { key: "llegada", texto: "Esperando llegada" };
  }
  if (input.abierto) return { key: "pendiente", texto: "Pendiente" };
  if (fold(input.estadoIcss) === "billed") return { key: "facturado", texto: "Facturado" };
  return { key: "cerrado", texto: "Cerrado" };
}
