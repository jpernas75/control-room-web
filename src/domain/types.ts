import type { Centro } from "./centros";

export type LineaConocida = {
  id: string;
  origen: "PREVENTIVO" | "CONTROL_ROOM";
  presencia: "ACTIVA" | "DESHABILITADA" | "ALERTA";
  expedienteId: string | null;
  vin: string;
  fechaIso: string | null;
  cuenta: string | null;
  vco: boolean;
};

export type DatosCr = {
  expedienteId: string;
  vin: string;
  cliente: string;
  matricula: string;
  modelo: string;
  km: string;
  prediagnostico: string;
  fase: string;
  estadoIcss: string;
  fechaIso: string;
  abierto: boolean;
  pago: string;
  cuenta: string;
  centro2: string;
  centroResuelto: Centro;
  vco: boolean;
  or: {
    id: string;
    numero: string;
    estado: string;
    url: string;
    fecha: string;
    fechaCita: string;
    fechaEntrega: string;
    cita: boolean;
  } | null;
};
