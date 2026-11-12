import { esCentroAjeno } from "./centros";

export type Sesion = { role: "ADMIN" | "CENTRO"; centroId: string | null; principal?: boolean };

function permitido(sesion: Sesion, linea: { centroId: string | null; centro2?: string | null; centroManual?: boolean }): boolean {
  if (esCentroAjeno(linea.centro2, linea.centroManual)) return sesion.principal === true;
  if (sesion.role === "ADMIN") return true;
  return linea.centroId !== null && linea.centroId === sesion.centroId;
}

type LineaAcceso = { centroId: string | null; centro2?: string | null; centroManual?: boolean };

export function puedeVer(sesion: Sesion, linea: LineaAcceso): boolean {
  return permitido(sesion, linea);
}

export function puedeEditar(sesion: Sesion, linea: LineaAcceso): boolean {
  return permitido(sesion, linea);
}
