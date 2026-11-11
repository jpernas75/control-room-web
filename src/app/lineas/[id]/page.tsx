import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MarcarDesplazado } from "@/components/MarcarDesplazado";
import { Nav } from "@/components/Nav";
import { CENTROS } from "@/domain/centros";
import { textoDetalle } from "@/domain/comentario";
import { hrefBandeja } from "@/domain/vista-bandeja";
import { puedeEditar, puedeVer } from "@/domain/acceso";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";
import { cambiarCentro, guardarComentario, guardarFechaPrevista, marcarDesplazado } from "./actions";

export const dynamic = "force-dynamic";

export default async function Ficha({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ volver?: string | string[] }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  const { id } = await params;
  const bandeja = hrefBandeja((await searchParams).volver);
  const linea = await prisma.linea.findUnique({
    where: { id },
    include: { centro: true, comentarioUser: true, cambios: { include: { user: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!linea || !puedeVer(sesion, linea)) notFound();
  const editar = puedeEditar(sesion, linea);
  const textoComentario = linea.origen === "PREVENTIVO" ? textoDetalle(linea) : linea.comentario;
  const otros = linea.vin
    ? await prisma.linea.findMany({ where: { vin: linea.vin, NOT: { id: linea.id } }, include: { centro: true } })
    : [];

  return (
    <>
      <Nav bandeja={bandeja} />
      <main className="mx-auto max-w-3xl px-4 py-6">
      <Link className="text-sm text-slate-600 underline" href={bandeja}>
        Volver a la bandeja
      </Link>
      <article className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">{linea.expedienteId || linea.vin}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {linea.origen === "PREVENTIVO" ? "Preventivo" : "Control Room"} · {linea.centro?.nombre ?? "Sin centro"} · {linea.cliente}
        </p>
        <dl className="mt-4 grid gap-2 text-sm">
          <Dato k="VIN" v={linea.vin} />
          <Dato k="Matrícula" v={linea.matricula} />
          <Dato k="Modelo" v={linea.modelo} />
          <Dato k="Prediagnóstico" v={linea.prediagnostico} />
          <Dato k="OR" v={[linea.orNumero, linea.orEstado, linea.orFechaCita && `Cita ${linea.orFechaCita}`].filter(Boolean).join(" · ")} />
          <Dato k="Trigger" v={linea.trigger} />
          <Dato k="Obs" v={linea.obs} />
          <Dato k="Dealer" v={linea.dealer} />
        </dl>
        {otros.length > 0 ? (
          <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-950">
            Este VIN tiene otros expedientes:{" "}
            {otros.map((o) => `${o.expedienteId || o.vin} (${o.vco ? "VCO" : "otro"})`).join(", ")}.
          </div>
        ) : null}
        {linea.presencia === "DESHABILITADA" ? <p className="mt-4 text-sm text-slate-600">Ya no aparece en ICSS.</p> : null}
        {linea.presencia === "ALERTA" ? (
          <p className="mt-4 text-sm text-amber-800">Salió de la lista de preventivos y no ha aparecido en ICSS.</p>
        ) : null}

        <form action={guardarComentario.bind(null, linea.id)} className="mt-6">
          <label className="block text-sm font-medium">
            Comentario
            <textarea name="comentario" defaultValue={textoComentario} rows={4} disabled={!editar} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          {linea.comentarioAt ? (
            <p className="mt-1 text-xs text-slate-500">
              {linea.comentarioUser?.name ?? "Alguien"} · {linea.comentarioAt.toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}
            </p>
          ) : textoComentario ? null : (
            <p className="mt-1 text-xs text-slate-500">Sin comentario</p>
          )}
          {editar ? <button className="mt-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white" type="submit">Guardar comentario</button> : null}
        </form>

        {linea.origen === "PREVENTIVO" ? (
          <MarcarDesplazado
            key={String(linea.desplazado)}
            marcado={linea.desplazado}
            editar={editar}
            action={marcarDesplazado.bind(null, linea.id)}
          />
        ) : null}

        <form action={cambiarCentro.bind(null, linea.id)} className="mt-6 flex items-end gap-2">
          <label className="text-sm font-medium">
            Reasignar centro
            <select name="centro" defaultValue={linea.centro?.nombre ?? ""} disabled={!editar} className="mt-1 block rounded-md border border-slate-300 px-3 py-2">
              {CENTROS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          {editar ? <button className="rounded-md border border-slate-300 px-3 py-2 text-sm" type="submit">Pasar</button> : null}
        </form>

        {linea.cambios.length > 0 ? (
          <ul className="mt-3 text-xs text-slate-500">
            {linea.cambios.map((c) => (
              <li key={c.id}>
                {c.user.name}: {c.desde} → {c.hacia} · {c.createdAt.toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}
              </li>
            ))}
          </ul>
        ) : null}

        {!linea.orFechaCita ? (
          <form action={guardarFechaPrevista.bind(null, linea.id)} className="mt-6">
            <div className="flex items-end gap-2">
              <label className="text-sm font-medium">
                Fecha de llegada prevista
                <input name="fecha" type="date" defaultValue={linea.fechaPrevista ?? ""} disabled={!editar} className="mt-1 block rounded-md border border-slate-300 px-3 py-2" />
              </label>
              {editar ? <button className="rounded-md border border-slate-300 px-3 py-2 text-sm" type="submit">Guardar fecha</button> : null}
            </div>
            <p className="mt-1 text-xs text-slate-500">Para que la fecha sea válida crear una cita en CAR</p>
          </form>
        ) : (
          <p className="mt-6 text-sm">Cita de ICSS: {linea.orFechaCita}. Fecha de llegada prevista: {linea.fechaPrevista || "ninguna"}.</p>
        )}
      </article>
      </main>
    </>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <div>
      <dt className="text-slate-500">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
