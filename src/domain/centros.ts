export const CENTROS = ["Sada", "Porriño", "Orense", "Santiago", "Pontevedra", "Lugo"] as const;
export type CentroNombre = (typeof CENTROS)[number];
export type Centro = CentroNombre | "Sin centro";

export const USUARIO_CENTRO: Record<string, CentroNombre> = {
  sada: "Sada",
  porrino: "Porriño",
  orense: "Orense",
  santiago: "Santiago",
  pontevedra: "Pontevedra",
  lugo: "Lugo",
};

const NOMBRE_CUENTA: Partial<Record<CentroNombre, string>> = {
  Porriño: "Vigo",
};

export function nombreCuenta(centro: CentroNombre): string {
  return NOMBRE_CUENTA[centro] ?? centro;
}

const ALIAS: Record<string, CentroNombre> = {
  sada: "Sada",
  coruna: "Sada",
  porrino: "Porriño",
  vigo: "Porriño",
  "o porrino": "Porriño",
  orense: "Orense",
  ourense: "Orense",
  santiago: "Santiago",
  "santiago de compostela": "Santiago",
  pontevedra: "Pontevedra",
  mourente: "Pontevedra",
  lugo: "Lugo",
};

const PREFIJO: Record<string, CentroNombre> = {
  OC: "Sada",
  OV: "Porriño",
  OO: "Orense",
  OS: "Santiago",
  OP: "Pontevedra",
  OL: "Lugo",
};

const CUENTA: Record<string, CentroNombre> = {
  "13495": "Sada",
  "13518": "Porriño",
  "39721": "Orense",
  "39720": "Santiago",
  "39719": "Pontevedra",
  "39723": "Lugo",
};

export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizarCentro(raw: string | null | undefined): CentroNombre | null {
  if (!raw) return null;
  return ALIAS[fold(raw)] ?? null;
}

export function centroDesdeOr(numero: string | null | undefined): CentroNombre | null {
  const pref = String(numero ?? "").trim().slice(0, 2).toUpperCase();
  return PREFIJO[pref] ?? null;
}

export function centroDesdeCuenta(cuenta: string | null | undefined): CentroNombre | null {
  return CUENTA[String(cuenta ?? "").trim()] ?? null;
}

export function resolverCentro(input: {
  centro2: string | null;
  numeroOr: string | null;
  cuenta: string | null;
  sedeExcel: string | null;
}): Centro {
  return (
    normalizarCentro(input.centro2) ??
    centroDesdeOr(input.numeroOr) ??
    centroDesdeCuenta(input.cuenta) ??
    normalizarCentro(input.sedeExcel) ??
    "Sin centro"
  );
}
