import { redirect } from "next/navigation";
import { Bandeja, type FilaBandeja } from "@/components/Bandeja";
import { Nav } from "@/components/Nav";
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
    vehiculo: l.matricula,
    detalle: l.origen === "PREVENTIVO" ? l.obs || l.trigger : l.prediagnostico,
    situacionKey: l.situacion.key,
    situacionTexto: l.situacion.texto,
    estadoIcss: l.estadoIcss,
    fechaIso: l.fechaIso,
    orCita: l.orCita,
    orNumero: l.orNumero,
    orId: l.orId,
    orEstado: l.orEstado,
    orUrl: l.orUrl,
    orFechaCita: l.orFechaCita,
    comentario: l.comentario,
  }));
  return (
    <>
      <Nav />
      <Bandeja filas={filas} />
    </>
  );
}
