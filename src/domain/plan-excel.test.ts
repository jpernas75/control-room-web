import { describe, expect, it } from "vitest";
import { elegirHoja, leerFilas, planImportExcel, resumirExcel } from "./plan-excel";
import type { LineaConocida } from "./types";

describe("excel", () => {
  it("elige la pestaña con la fecha más alta y avisa si ninguna tiene fecha", () => {
    expect(elegirHoja(["20261106", "20261111"]).nombre).toBe("20261111");
    expect(elegirHoja(["Notas", "Final"]).aviso).toMatch(/última/);
    expect(elegirHoja(["Notas", "Final"]).nombre).toBe("Final");
  });

  it("lee por cabecera y rechaza si falta VIN", () => {
    const ok = leerFilas([
      { nombre: "20261106", filas: [["VIN", "DEALER"]] },
      {
        nombre: "20261111",
        filas: [
          ["Customer", "VIN", "SEDE", "Trigger", "Obs"],
          ["Cano", "abc123", "Sada", "nuevo", "Agendado"],
        ],
      },
    ]);
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.hoja).toBe("20261111");
    expect(ok.filas[0]).toMatchObject({
      vin: "ABC123",
      sede: "Sada",
      customer: "Cano",
      trigger: "nuevo",
      obs: "Agendado",
      dealer: "",
    });
    expect(leerFilas([{ nombre: "20261111", filas: [["SEDE"], ["Sada"]] }]).ok).toBe(false);
  });

  it("crea, actualiza, no duplica un VCO y alerta al que desaparece", () => {
    const vco: LineaConocida = {
      id: "cr",
      origen: "CONTROL_ROOM",
      presencia: "ACTIVA",
      expedienteId: "8",
      vin: "YAENICSS",
      fechaIso: "2026-11-01",
      cuenta: "13518",
      vco: true,
    };
    const prev: LineaConocida = {
      id: "p",
      origen: "PREVENTIVO",
      presencia: "ACTIVA",
      expedienteId: null,
      vin: "SIGUE",
      fechaIso: null,
      cuenta: null,
      vco: false,
    };
    const seVa: LineaConocida = { ...prev, id: "q", vin: "SEVA" };
    const acciones = planImportExcel(
      [
        { vin: "YAENICSS", sede: "Sada", customer: "A", trigger: "", obs: "", dealer: "" },
        { vin: "SIGUE", sede: "Lugo", customer: "B", trigger: "nuevo", obs: "", dealer: "" },
        { vin: "NUEVO", sede: "Orense", customer: "C", trigger: "", obs: "", dealer: "" },
      ],
      [vco, prev, seVa],
    );
    expect(acciones.map((a) => a.tipo).sort()).toEqual(["actualizar_preventivo", "alerta_preventivo", "crear_preventivo"]);
    expect(resumirExcel(acciones)).toEqual({ nuevos: 1, actualizan: 1, alertas: 1 });
  });
});
