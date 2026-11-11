import { describe, expect, it } from "vitest";
import { puedeEditar, puedeVer } from "./acceso";

const admin = { role: "ADMIN" as const, centroId: null };
const sada = { role: "CENTRO" as const, centroId: "id-sada" };

describe("acceso", () => {
  it("el administrador ve Sin centro y cualquier delegación", () => {
    expect(puedeVer(admin, { centroId: null })).toBe(true);
    expect(puedeEditar(admin, { centroId: "id-lugo" })).toBe(true);
  });

  it("una cuenta de centro no ve Sin centro ni otra delegación", () => {
    expect(puedeVer(sada, { centroId: null })).toBe(false);
    expect(puedeVer(sada, { centroId: "id-lugo" })).toBe(false);
    expect(puedeEditar(sada, { centroId: "id-lugo" })).toBe(false);
  });

  it("una cuenta de centro ve y edita el suyo", () => {
    expect(puedeVer(sada, { centroId: "id-sada" })).toBe(true);
    expect(puedeEditar(sada, { centroId: "id-sada" })).toBe(true);
  });
});
