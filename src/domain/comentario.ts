type LineaTexto = {
  origen: "PREVENTIVO" | "CONTROL_ROOM";
  obs: string;
  trigger: string;
  prediagnostico: string;
  comentario: string;
  comentarioAt: Date | null;
};

export function textoExcelPreventivo(linea: { obs: string; trigger: string }): string {
  return linea.obs || linea.trigger;
}

/** En un preventivo el detalle de la tabla y el comentario de la ficha son el mismo texto. */
export function textoDetalle(linea: LineaTexto): string {
  if (linea.origen !== "PREVENTIVO") return linea.prediagnostico;
  if (linea.comentarioAt) return linea.comentario;
  return textoExcelPreventivo(linea);
}
