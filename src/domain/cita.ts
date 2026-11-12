export type AvisoCita = "" | "sin" | "distinta";

export function diaCita(raw: string | null | undefined): string {
  const texto = String(raw ?? "").trim();
  const iso = texto.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const es = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!es) return "";
  return `${es[3]}-${es[2].padStart(2, "0")}-${es[1].padStart(2, "0")}`;
}

export function fechaCitaVisible(raw: string | null | undefined): string {
  const dia = diaCita(raw);
  if (!dia) return "";
  const [ano, mes, d] = dia.split("-");
  return `${d}/${mes}/${ano}`;
}

export function avisoDeCita(fechaWeb: string | null | undefined, orCita: boolean, fechaCar: string | null | undefined): AvisoCita {
  if (!diaCita(fechaWeb)) return "";
  const car = orCita ? diaCita(fechaCar) : "";
  if (!car) return "sin";
  if (car !== diaCita(fechaWeb)) return "distinta";
  return "";
}

export function textoAvisoCita(aviso: string, fechaWeb?: string | null, fechaCar?: string | null): string {
  if (aviso === "sin") return "No tiene cita en CAR.";
  if (aviso === "distinta") {
    const car = fechaCitaVisible(fechaCar);
    const web = fechaCitaVisible(fechaWeb);
    if (car && web) return `La fecha de la cita de CAR (${car}) no coincide con la de la web (${web}).`;
    return "La fecha de la cita de CAR no coincide.";
  }
  return "";
}
