import { describe, expect, it } from "vitest";
import { planImportJson, resumirJson } from "./plan-json";
import type { LineaConocida } from "./types";

function caso(partial: Record<string, unknown>) {
  return {
    id: "8001",
    tipo: "Control Room",
    centro: "13518",
    fecha_iso: "2026-11-01T10:00:00",
    estado: "Open",
    open: true,
    fields: {
      VIN: "VINPREV",
      Cliente: "Cliente",
      Matrícula: "0000AAA",
      modelo: "S-WAY",
      Km: "1",
      Prediagnóstico: "MY24_Heavy_Engine_VCO + alta",
      Fase: "Searching for workshop",
      Pago: "Warranty",
    },
    or_car: null,
    ...partial,
  };
}

const payloadBase = {
  period: { from: "2026-05-01", to: "2026-11-11" },
  meta: { sources: [{ account: "13518", tipo: "Control Room", error: 0 }] },
};

const preventivo: LineaConocida = {
  id: "p1",
  origen: "PREVENTIVO",
  presencia: "ACTIVA",
  expedienteId: null,
  vin: "VINPREV",
  fechaIso: null,
  cuenta: null,
  vco: false,
};

describe("planImportJson", () => {
  it("rechaza un JSON sin cases", () => {
    expect(planImportJson({ period: payloadBase.period, meta: payloadBase.meta }, []).ok).toBe(false);
  });

  it("convierte el preventivo solo si el prediagnóstico contiene VCO", () => {
    const vco = planImportJson({ ...payloadBase, cases: [caso({})] }, [preventivo]);
    expect(vco.ok).toBe(true);
    if (!vco.ok) return;
    expect(vco.acciones).toEqual([expect.objectContaining({ tipo: "convertir", lineaId: "p1" })]);

    const turbo = planImportJson(
      {
        ...payloadBase,
        cases: [caso({ fields: { ...caso({}).fields, Prediagnóstico: "TURBOCHARGING SYSTEM", VIN: "VINPREV" } })],
      },
      [preventivo],
    );
    expect(turbo.ok).toBe(true);
    if (!turbo.ok) return;
    expect(turbo.acciones.map((a) => a.tipo)).toEqual(["upsert_cr"]);
  });

  it("si hay dos VCO del mismo VIN, el preventivo se convierte en el más reciente", () => {
    const plan = planImportJson(
      {
        ...payloadBase,
        cases: [
          caso({ id: "viejo", fecha_iso: "2026-06-01T00:00:00" }),
          caso({ id: "nuevo", fecha_iso: "2026-11-02T00:00:00" }),
        ],
      },
      [preventivo],
    );
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const conv = plan.acciones.find((a) => a.tipo === "convertir");
    expect(conv && "datos" in conv && conv.datos.expedienteId).toBe("nuevo");
    expect(plan.acciones.some((a) => a.tipo === "upsert_cr" && a.datos.expedienteId === "viejo")).toBe(true);
  });

  it("no deshabilita fuera de periodo ni si la cuenta vino con error", () => {
    const dentro: LineaConocida = {
      id: "c1", origen: "CONTROL_ROOM", presencia: "ACTIVA", expedienteId: "111",
      vin: "A", fechaIso: "2026-08-01T00:00:00", cuenta: "13518", vco: false,
    };
    const fuera: LineaConocida = { ...dentro, id: "c2", expedienteId: "222", fechaIso: "2026-01-01T00:00:00" };
    const conError = planImportJson(
      { ...payloadBase, meta: { sources: [{ account: "13518", tipo: "Control Room", error: 1 }] }, cases: [] },
      [dentro],
    );
    const antiguo = planImportJson({ ...payloadBase, cases: [] }, [fuera]);
    expect(conError.ok && conError.acciones).toEqual([]);
    expect(antiguo.ok && antiguo.acciones).toEqual([]);
    const si = planImportJson({ ...payloadBase, cases: [] }, [dentro]);
    expect(si.ok && si.acciones).toEqual([{ tipo: "deshabilitar", lineaId: "c1", expedienteId: "111" }]);
  });

  it("resume altas, actualizaciones y deshabilitados", () => {
    expect(
      resumirJson([
        { tipo: "upsert_cr", lineaId: null, datos: {} as never },
        { tipo: "upsert_cr", lineaId: "x", datos: {} as never },
        { tipo: "convertir", lineaId: "p", datos: {} as never },
        { tipo: "deshabilitar", lineaId: "c", expedienteId: "1" },
      ]),
    ).toEqual({ entran: 2, actualizan: 1, deshabilitan: 1 });
  });
});
