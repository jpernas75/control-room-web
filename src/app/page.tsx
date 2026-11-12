import { redirect } from "next/navigation";
import { Bandeja, type FilaBandeja } from "@/components/Bandeja";
import { Nav } from "@/components/Nav";
import { textoDetalle } from "@/domain/comentario";
import { nombreCentroVisible } from "@/domain/centros";
import { vistaDesdeConsulta } from "@/domain/vista-bandeja";
import { listarLineas } from "@/lib/lineas";
import { sesionActual } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export default async function PaginaBandeja({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const inicial = vistaDesdeConsulta(await searchParams);
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  const lineas = await listarLineas(sesion);
  const filas: FilaBandeja[] = lineas.map((l) => ({
    id: l.id,
    origen: l.origen,
    presencia: l.presencia,
    expedienteId: l.expedienteId ?? "",
    vin: l.vin,
    centro: nombreCentroVisible(l),
    cliente: l.cliente,
    vehiculo: l.matricula,
    detalle: textoDetalle(l),
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
    desplazado: l.desplazado,
    solicitarCr: l.solicitarCr,
    nuevo: l.esNuevo,
    fechaPrevista: l.fechaPrevista ?? "",
  }));
  return (
    <>
      <Nav />
      <Bandeja filas={filas} inicial={inicial} />
    </>
  );
}
