import { describe, expect, it } from "vitest";
import { textoDetalle } from "./comentario";

const base = {
  origen: "PREVENTIVO" as const,
  obs: "Desplazado Onauto (Huelva)",
  trigger: "VCO",
  prediagnostico: "",
  comentario: "",
  comentarioAt: null,
};

describe("texto de preventivo", () => {
  it("muestra la obs del Excel mientras nadie ha guardado el comentario", () => {
    expect(textoDetalle(base)).toBe("Desplazado Onauto (Huelva)");
  });

  it("usa el trigger si la obs está vacía", () => {
    expect(textoDetalle({ ...base, obs: "" })).toBe("VCO");
  });

  it("tras guardar, el comentario sustituye al texto del Excel", () => {
    expect(textoDetalle({ ...base, comentario: "Llega el viernes", comentarioAt: new Date("2026-11-11") })).toBe("Llega el viernes");
  });

  it("un comentario guardado vacío no vuelve a la obs", () => {
    expect(textoDetalle({ ...base, comentario: "", comentarioAt: new Date("2026-11-11") })).toBe("");
  });

  it("en un Control Room el detalle sigue siendo el prediagnóstico", () => {
    expect(textoDetalle({ ...base, origen: "CONTROL_ROOM", prediagnostico: "PID VCO" })).toBe("PID VCO");
  });
});
