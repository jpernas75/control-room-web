import { describe, expect, it } from "vitest";
import { avisoDeCita, textoAvisoCita } from "./cita";

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

  it("explica el aviso", () => {
    expect(textoAvisoCita("sin")).toBe("No tiene cita en CAR.");
    expect(textoAvisoCita("distinta", "2026-11-16", "2026-11-18")).toBe(
      "La fecha de la cita de CAR (18/11/2026) no coincide con la de la web (16/11/2026).",
    );
  });
});
