export const CLAVES_ORDEN = ["situacion", "ref", "centro", "cliente", "vehiculo", "detalle", "fecha", "or", "estado", "desplazado"] as const;

export type ClaveOrden = (typeof CLAVES_ORDEN)[number];

export type OrdenBandeja = { key: ClaveOrden; dir: "asc" | "desc" };

export type VistaBandeja = {
  centros: string[];
  ocultarDeshabilitadas: boolean;
  ocultarAlertas: boolean;
  situacion: string;
  estado: string;
  detalle: string;
  busqueda: string;
  ordenCr: OrdenBandeja;
  ordenPrev: OrdenBandeja;
};

export const VISTA_INICIAL: VistaBandeja = {
  centros: [],
  ocultarDeshabilitadas: false,
  ocultarAlertas: false,
  situacion: "",
  estado: "Open",
  detalle: "",
  busqueda: "",
  ordenCr: { key: "fecha", dir: "desc" },
  ordenPrev: { key: "cliente", dir: "asc" },
};

type Consulta = URLSearchParams | Record<string, string | string[] | undefined>;

function lista(entrada: Consulta, clave: string): string[] {
  if (entrada instanceof URLSearchParams) return entrada.getAll(clave);
  const valor = entrada[clave];
  if (Array.isArray(valor)) return valor;
  if (typeof valor === "string") return [valor];
  return [];
}

function presente(entrada: Consulta, clave: string): boolean {
  if (entrada instanceof URLSearchParams) return entrada.has(clave);
  return Object.prototype.hasOwnProperty.call(entrada, clave) && entrada[clave] !== undefined;
}

function orden(raw: string | undefined, defecto: OrdenBandeja): OrdenBandeja {
  if (!raw) return defecto;
  const [key, dir] = raw.split(".");
  if (!CLAVES_ORDEN.includes(key as ClaveOrden)) return defecto;
  if (dir !== "asc" && dir !== "desc") return defecto;
  return { key: key as ClaveOrden, dir };
}

function texto(valor: string, max: number): string {
  return valor.trim().slice(0, max);
}

export function vistaDesdeConsulta(entrada: Consulta): VistaBandeja {
  const estado = presente(entrada, "estado") ? texto(lista(entrada, "estado")[0] ?? "", 40) : VISTA_INICIAL.estado;
  return {
    centros: lista(entrada, "centro").map((c) => texto(c, 40)).filter(Boolean),
    ocultarDeshabilitadas: lista(entrada, "ocultar").includes("deshabilitados"),
    ocultarAlertas: lista(entrada, "ocultar").includes("alertas"),
    situacion: texto(lista(entrada, "situacion")[0] ?? "", 120),
    estado,
    detalle: texto(lista(entrada, "detalle")[0] ?? "", 1500),
    busqueda: texto(lista(entrada, "q")[0] ?? "", 200),
    ordenCr: orden(lista(entrada, "ord")[0], VISTA_INICIAL.ordenCr),
    ordenPrev: orden(lista(entrada, "ordp")[0], VISTA_INICIAL.ordenPrev),
  };
}

export function consultaDesdeVista(vista: VistaBandeja): string {
  const params = new URLSearchParams();
  for (const centro of vista.centros) params.append("centro", centro);
  if (vista.ocultarDeshabilitadas) params.append("ocultar", "deshabilitados");
  if (vista.ocultarAlertas) params.append("ocultar", "alertas");
  if (vista.situacion) params.set("situacion", vista.situacion);
  if (vista.estado !== VISTA_INICIAL.estado) params.set("estado", vista.estado);
  if (vista.detalle) params.set("detalle", vista.detalle);
  if (vista.busqueda) params.set("q", vista.busqueda);
  if (vista.ordenCr.key !== VISTA_INICIAL.ordenCr.key || vista.ordenCr.dir !== VISTA_INICIAL.ordenCr.dir) {
    params.set("ord", `${vista.ordenCr.key}.${vista.ordenCr.dir}`);
  }
  if (vista.ordenPrev.key !== VISTA_INICIAL.ordenPrev.key || vista.ordenPrev.dir !== VISTA_INICIAL.ordenPrev.dir) {
    params.set("ordp", `${vista.ordenPrev.key}.${vista.ordenPrev.dir}`);
  }
  return params.toString();
}

export function hrefBandeja(volver: string | string[] | undefined): string {
  const raw = Array.isArray(volver) ? volver[0] : volver;
  if (!raw) return "/";
  const qs = consultaDesdeVista(vistaDesdeConsulta(new URLSearchParams(raw)));
  return qs ? `/?${qs}` : "/";
}
