import { fold } from "./centros";

export type Marca = {
  tipo: "prevista" | "cita" | "cita_pasada" | "en_taller" | "realizada";
  desde: string;
  hasta: string;
  deshabilitada: boolean;
};

export type LineaCalendario = {
  presencia: "ACTIVA" | "DESHABILITADA" | "ALERTA";
  fechaPrevista: string | null;
  orCita: boolean;
  orEstado: string | null;
  orFecha: string | null;
  orFechaCita: string | null;
  orFechaEntrega: string | null;
};

export function recepcionDe(fecha: string | null | undefined): string | null {
  const m = String(fecha ?? "").match(/recepci[oó]n\s+(\d{4}-\d{2}-\d{2})/i);
  return m ? m[1] : null;
}

function dia(desde: string, hasta: string, tipo: Marca["tipo"], deshabilitada: boolean): Marca {
  return { tipo, desde, hasta, deshabilitada };
}

export function marcasDeLinea(linea: LineaCalendario, hoy: string): Marca[] {
  const off = linea.presencia === "DESHABILITADA";
  const out: Marca[] = [];
  if (linea.orCita && linea.orFechaCita) {
    const tipo = linea.orFechaCita < hoy ? "cita_pasada" : "cita";
    out.push(dia(linea.orFechaCita, linea.orFechaCita, tipo, off));
  } else if (linea.fechaPrevista) {
    out.push(dia(linea.fechaPrevista, linea.fechaPrevista, "prevista", off));
  }

  if (!linea.orCita && (linea.orEstado || linea.orFecha || linea.orFechaEntrega)) {
    const recepcion = recepcionDe(linea.orFecha) ?? (linea.orFechaEntrega || null);
    if (recepcion) {
      const entregada = fold(linea.orEstado ?? "") === "vehiculo entregado";
      if (entregada) {
        out.push(dia(recepcion, linea.orFechaEntrega || recepcion, "realizada", off));
      } else if (linea.orFechaEntrega) {
        out.push(dia(recepcion, linea.orFechaEntrega, "en_taller", off));
      } else {
        out.push(dia(recepcion, hoy, "en_taller", off));
      }
    }
  }
  return out;
}

export function mesesCompletos(conDatos: string[], hoy: string): string[] {
  const validos = [...conDatos, hoy].filter((m) => /^\d{4}-\d{2}$/.test(m)).sort();
  if (validos.length === 0) return [];
  const desdeAno = Number(validos[0].slice(0, 4));
  const hastaAno = Number(validos[validos.length - 1].slice(0, 4));
  const out: string[] = [];
  for (let ano = desdeAno; ano <= hastaAno; ano += 1) {
    for (let mes = 1; mes <= 12; mes += 1) out.push(`${ano}-${String(mes).padStart(2, "0")}`);
  }
  return out;
}

export function mesesConMarcas(marcas: Marca[]): string[] {
  const meses = new Set<string>();
  for (const m of marcas) {
    let cursor = m.desde.slice(0, 10);
    const fin = m.hasta.slice(0, 10);
    while (cursor <= fin) {
      meses.add(cursor.slice(0, 7));
      const [y, mo, d] = cursor.split("-").map(Number);
      const next = new Date(Date.UTC(y, mo - 1, d + 1));
      cursor = next.toISOString().slice(0, 10);
    }
  }
  return [...meses].sort();
}
