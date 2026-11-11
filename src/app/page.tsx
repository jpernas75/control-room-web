import { redirect } from "next/navigation";
import { Bandeja, type FilaBandeja } from "@/components/Bandeja";
import { listarLineas } from "@/lib/lineas";
import { sesionActual } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export default async function PaginaBandeja() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  const lineas = await listarLineas(sesion);
  const filas: FilaBandeja[] = lineas.map((l) => ({
    id: l.id,
    origen: l.origen,
    presencia: l.presencia,
    expedienteId: l.expedienteId ?? "",
    vin: l.vin,
    centro: l.centro?.nombre ?? "Sin centro",
    cliente: l.cliente,
    vehiculo: [l.matricula, l.modelo].filter(Boolean).join(" · "),
    detalle: l.origen === "PREVENTIVO" ? l.obs || l.trigger : l.prediagnostico,
    situacionKey: l.situacion.key,
    situacionTexto: l.situacion.texto,
    fase: l.fase,
    estadoIcss: l.estadoIcss,
    pago: l.pago,
    fechaIso: l.fechaIso,
  }));
  return <Bandeja filas={filas} />;
}
