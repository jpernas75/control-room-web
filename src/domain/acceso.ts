export type Sesion = { role: "ADMIN" | "CENTRO"; centroId: string | null };

function permitido(sesion: Sesion, linea: { centroId: string | null }): boolean {
  if (sesion.role === "ADMIN") return true;
  return linea.centroId !== null && linea.centroId === sesion.centroId;
}

export function puedeVer(sesion: Sesion, linea: { centroId: string | null }): boolean {
  return permitido(sesion, linea);
}

export function puedeEditar(sesion: Sesion, linea: { centroId: string | null }): boolean {
  return permitido(sesion, linea);
}
