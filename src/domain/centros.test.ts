import { describe, expect, it } from "vitest";
import { USUARIO_CENTRO, centroDesdeCuenta, centroDesdeOr, cuentaNormalizada, nombreCuenta, normalizarCentro, resolverCentro } from "./centros";

describe("centros", () => {
  it("la cuenta de Porriño se llama Vigo y no distingue mayúsculas", () => {
    expect(nombreCuenta("Porriño")).toBe("Vigo");
    expect(nombreCuenta("Lugo")).toBe("Lugo");
    expect(USUARIO_CENTRO.vigo).toBe("Porriño");
    expect(cuentaNormalizada(" VIGO ")).toBe("vigo");
    expect(cuentaNormalizada("Sada")).toBe("sada");
  });

  it("normaliza alias del Excel y de ICSS", () => {
    expect(normalizarCentro("Ourense")).toBe("Orense");
    expect(normalizarCentro("Porrino")).toBe("Porriño");
    expect(normalizarCentro("Vigo")).toBe("Porriño");
    expect(normalizarCentro("O Porriño")).toBe("Porriño");
    expect(normalizarCentro("Mourente")).toBe("Pontevedra");
    expect(normalizarCentro("Coruña")).toBe("Sada");
    expect(normalizarCentro("Logroño")).toBeNull();
  });

  it("resuelve Centro 2 por centro2, por prefijo OS y por cuenta 13518", () => {
    expect(resolverCentro({ centro2: "Orense", numeroOr: "OS2602194", cuenta: "13518", sedeExcel: null })).toBe("Orense");
    expect(resolverCentro({ centro2: "", numeroOr: "OS2602194", cuenta: "13518", sedeExcel: null })).toBe("Santiago");
    expect(resolverCentro({ centro2: "", numeroOr: "", cuenta: "13518", sedeExcel: null })).toBe("Porriño");
    expect(resolverCentro({ centro2: "", numeroOr: "", cuenta: "", sedeExcel: "Lugo" })).toBe("Lugo");
    expect(resolverCentro({ centro2: "", numeroOr: "", cuenta: "99999", sedeExcel: "Bilbao" })).toBe("Sin centro");
  });

  it("lee el prefijo y la cuenta sueltos", () => {
    expect(centroDesdeOr("oc2600001")).toBe("Sada");
    expect(centroDesdeOr("")).toBeNull();
    expect(centroDesdeCuenta("39723")).toBe("Lugo");
    expect(centroDesdeCuenta("1")).toBeNull();
  });
});
