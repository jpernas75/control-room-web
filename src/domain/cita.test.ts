import { describe, expect, it } from "vitest";
import { avisoDeCita, fechaPrevistaTrasImport, orCarSuperaManual, textoAvisoCita } from "./cita";

const orEntregada = {
  id: "91905",
  numero: "OL2602337",
  estado: "Vehículo entregado",
  fechaCita: "",
  fechaEntrega: "2026-11-20",
  cita: false,
};

describe("aviso de cita", () => {
  it("sin fecha en la web no avisa", () => {
    expect(avisoDeCita("", false, "")).toBe("");
    expect(avisoDeCita(null, true, "2026-11-16")).toBe("");
  });

  it("avisa si CAR no tiene cita", () => {
    expect(avisoDeCita("2026-11-16", false, "")).toBe("sin");
    expect(avisoDeCita("2026-11-16", true, "")).toBe("sin");
  });

  it("avisa si el día no coincide y calla si es el mismo", () => {
    expect(avisoDeCita("2026-11-16", true, "2026-11-18")).toBe("distinta");
    expect(avisoDeCita("2026-11-16", true, "16/11/2026")).toBe("");
    expect(avisoDeCita("2026-11-16", true, "2026-11-16T09:00:00")).toBe("");
  });

  it("no avisa si la fecha manual queda obsoleta porque CAR ya tiene OR o cita hecha", () => {
    expect(avisoDeCita("2026-11-16", false, "", orEntregada)).toBe("");
    expect(
      avisoDeCita("2026-11-16", false, "", {
        numero: "OL2602374",
        estado: "En reparación",
        fechaEntrega: "2026-11-20",
        cita: false,
      }),
    ).toBe("");
  });

  it("explica el aviso", () => {
    expect(textoAvisoCita("sin")).toBe("No tiene cita en CAR.");
    expect(textoAvisoCita("distinta", "2026-11-16", "2026-11-18")).toBe(
      "La fecha de la cita de CAR (18/11/2026) no coincide con la de la web (16/11/2026).",
    );
  });
});

describe("fecha prevista tras import JSON", () => {
  it("la OR de CAR sustituye la fecha tecleada a mano", () => {
    expect(orCarSuperaManual(orEntregada)).toBe(true);
    expect(orCarSuperaManual({ cita: true, fechaCita: "2026-12-01", estado: "Cita en preparación" })).toBe(true);
    expect(orCarSuperaManual(null)).toBe(false);
    expect(orCarSuperaManual({ cita: false, numero: "", estado: "", fechaCita: "", fechaEntrega: "" })).toBe(false);
    expect(fechaPrevistaTrasImport(orEntregada, "2026-11-16")).toBeNull();
    expect(fechaPrevistaTrasImport(null, "2026-11-16")).toBe("2026-11-16");
  });
});
