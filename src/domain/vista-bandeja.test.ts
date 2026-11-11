import { describe, expect, it } from "vitest";
import { consultaDesdeVista, hrefBandeja, VISTA_INICIAL, vistaDesdeConsulta } from "./vista-bandeja";

describe("vista de la bandeja", () => {
  it("sin parámetros deja el estado Open y el resto vacío", () => {
    expect(vistaDesdeConsulta({})).toEqual(VISTA_INICIAL);
    expect(consultaDesdeVista(VISTA_INICIAL)).toBe("");
  });

  it("conserva centros, búsqueda, desplegables y el estado Todos", () => {
    const vista = vistaDesdeConsulta({
      centro: ["Porriño", "Sada"],
      estado: "",
      situacion: "Pendiente",
      q: "5784NBC",
      ocultar: ["deshabilitados", "alertas"],
    });
    expect(vista.centros).toEqual(["Porriño", "Sada"]);
    expect(vista.estado).toBe("");
    expect(vista.situacion).toBe("Pendiente");
    expect(vista.busqueda).toBe("5784NBC");
    expect(vista.ocultarDeshabilitadas).toBe(true);
    expect(vista.ocultarAlertas).toBe(true);
    const otra = vistaDesdeConsulta(new URLSearchParams(consultaDesdeVista(vista)));
    expect(otra).toEqual(vista);
  });

  it("el enlace de vuelta solo acepta los filtros de la bandeja", () => {
    expect(hrefBandeja(undefined)).toBe("/");
    expect(hrefBandeja("centro=Lugo&estado=&siguiente=https://otro.example")).toBe("/?centro=Lugo&estado=");
  });
});
