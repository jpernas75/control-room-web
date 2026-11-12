import { describe, expect, it } from "vitest";
import { esVco, situacion } from "./situacion";

const base = {
  origen: "CONTROL_ROOM" as const,
  presencia: "ACTIVA" as const,
  abierto: true,
  estadoIcss: "Open",
  fase: "Searching for workshop",
  tieneOr: false,
  orEntregada: false,
  fechaIso: "2026-11-01T10:00:00",
  hoy: "2026-11-11",
};

describe("situacion", () => {
  it("detecta la campaña por el texto VCO", () => {
    expect(esVco("MY24_Heavy_Engine_VCO + MY24 - HIGH COOLANT PRESSURE")).toBe(true);
    expect(esVco("TURBOCHARGING SYSTEM")).toBe(false);
  });

  it("marca cerrar, abierto, llegada, pendiente, facturado y cerrado", () => {
    expect(situacion({ ...base, tieneOr: true, orEntregada: true }).texto).toBe("Cerrar en ICSS");
    expect(situacion({ ...base, fechaIso: "2026-11-01T10:00:00", hoy: "2026-11-11" }).texto).toBe("Abierto");
    expect(situacion({ ...base, fechaIso: "2026-11-10T10:00:00", fase: "Waiting for arrival" }).texto).toBe("Esperando llegada");
    expect(situacion({ ...base, fechaIso: "2026-11-10T10:00:00", tieneOr: true }).texto).toBe("Pendiente");
    expect(situacion({ ...base, abierto: false, estadoIcss: "Billed" }).texto).toBe("Facturado");
    expect(situacion({ ...base, abierto: false, estadoIcss: "Closed" }).texto).toBe("Cerrado");
  });

  it("usa los avisos de presencia antes que la fase", () => {
    expect(situacion({ ...base, presencia: "DESHABILITADA" }).texto).toBe("Ya no aparece en ICSS");
    expect(situacion({ ...base, origen: "PREVENTIVO", presencia: "ACTIVA" }).texto).toBe("Preventivo");
    expect(situacion({ ...base, origen: "PREVENTIVO", presencia: "ALERTA" }).texto).toBe("Salió de la lista");
  });
});
