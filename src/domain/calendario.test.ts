import { describe, expect, it } from "vitest";
import { marcasDeLinea, mesesCompletos, mesesConMarcas, recepcionDe } from "./calendario";

const vacia = {
  presencia: "ACTIVA" as const,
  fechaPrevista: null as string | null,
  orCita: false,
  orEstado: null as string | null,
  orFecha: null as string | null,
  orFechaCita: null as string | null,
  orFechaEntrega: null as string | null,
};

describe("calendario", () => {
  it("lee la recepción del texto de la OR", () => {
    expect(recepcionDe("Recepción 2026-10-26 · Devolución 2026-10-29")).toBe("2026-10-26");
    expect(recepcionDe("")).toBeNull();
  });

  it("la fecha prevista deja de ser la marca cuando llega fecha_cita", () => {
    const soloPrevista = marcasDeLinea({ ...vacia, fechaPrevista: "2026-11-20" }, "2026-11-11");
    expect(soloPrevista.map((m) => m.tipo)).toEqual(["prevista"]);
    const conCita = marcasDeLinea(
      { ...vacia, fechaPrevista: "2026-11-20", orCita: true, orFechaCita: "2026-11-24", orEstado: "Cita" },
      "2026-11-11",
    );
    expect(conCita.map((m) => m.tipo)).toEqual(["cita"]);
    expect(conCita[0].desde).toBe("2026-11-24");
  });

  it("clasifica cita pasada, en taller, realizada y deshabilitada", () => {
    expect(
      marcasDeLinea({ ...vacia, orCita: true, orFechaCita: "2026-11-04", orEstado: "Cita" }, "2026-11-11")[0].tipo,
    ).toBe("cita_pasada");
    const taller = marcasDeLinea(
      { ...vacia, orEstado: "Trabajos validados", orFecha: "Recepción 2026-11-02", orFechaEntrega: "2026-11-18" },
      "2026-11-11",
    )[0];
    expect(taller).toMatchObject({ tipo: "en_taller", desde: "2026-11-02", hasta: "2026-11-18" });
    const hecha = marcasDeLinea(
      { ...vacia, orEstado: "Vehículo entregado", orFecha: "Recepción 2026-10-26", orFechaEntrega: "2026-10-29" },
      "2026-11-11",
    )[0];
    expect(hecha).toMatchObject({ tipo: "realizada", desde: "2026-10-26", hasta: "2026-10-29" });
    const gris = marcasDeLinea(
      { ...vacia, presencia: "DESHABILITADA", orCita: true, orFechaCita: "2026-11-24", orEstado: "Cita" },
      "2026-11-11",
    )[0];
    expect(gris.deshabilitada).toBe(true);
  });

  it("incluye los meses vacíos del año", () => {
    const meses = mesesCompletos(["2026-05", "2026-11"], "2026-11");
    expect(meses[0]).toBe("2026-01");
    expect(meses).toContain("2026-06");
    expect(meses.at(-1)).toBe("2026-12");
    expect(meses).toHaveLength(12);
  });

  it("un preventivo sin fecha no genera meses", () => {
    expect(mesesConMarcas(marcasDeLinea(vacia, "2026-11-11"))).toEqual([]);
    expect(mesesConMarcas(marcasDeLinea({ ...vacia, fechaPrevista: "2026-12-02" }, "2026-11-11"))).toEqual(["2026-12"]);
  });
});
