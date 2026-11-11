"use server";

import { revalidatePath } from "next/cache";
import { aplicarExcel, aplicarJson, previsualizarExcel, previsualizarJson } from "@/lib/aplicar-import";
import { sesionActual } from "@/lib/sesion";

export type EstadoImport = { error?: string; texto?: string } | null;

export async function procesar(_prev: EstadoImport, formData: FormData): Promise<EstadoImport> {
  const sesion = await sesionActual();
  if (sesion?.role !== "ADMIN") return { error: "Solo el administrador importa" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Falta el fichero" };
  const tipo = String(formData.get("tipo"));
  const intent = String(formData.get("intent"));
  if (tipo === "json") {
    let payload: unknown;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      return { error: "El JSON no se puede leer" };
    }
    if (intent !== "confirm") {
      const visto = await previsualizarJson(payload);
      if (!visto.ok) return { error: visto.error };
      const r = visto.resumen;
      return { texto: `Entran ${r.entran}, se actualizan ${r.actualizan}, se deshabilitan ${r.deshabilitan}. ${visto.aviso ?? ""} Nada se ha guardado.` };
    }
    const hecho = await aplicarJson(payload);
    if (!hecho.ok) return { error: hecho.error };
    revalidatePath("/");
    const r = hecho.resumen;
    return { texto: `Guardado. Entran ${r.entran}, se actualizan ${r.actualizan}, se deshabilitan ${r.deshabilitan}. ${hecho.aviso ?? ""}` };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (intent !== "confirm") {
    const visto = await previsualizarExcel(buffer);
    if (!visto.ok) return { error: visto.error };
    const r = visto.resumen;
    return {
      texto: `Hoja ${visto.hoja}. Nuevos ${r.nuevos}, se actualizan ${r.actualizan}, alertas ${r.alertas}. ${visto.aviso ?? ""} Nada se ha guardado.`,
    };
  }
  const hecho = await aplicarExcel(buffer);
  if (!hecho.ok) return { error: hecho.error };
  revalidatePath("/");
  const r = hecho.resumen;
  return { texto: `Guardado. Hoja ${hecho.hoja}. Nuevos ${r.nuevos}, se actualizan ${r.actualizan}, alertas ${r.alertas}. ${hecho.aviso ?? ""}` };
}
