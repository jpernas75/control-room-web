import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LlegadaPrevista, ReasignarCentro } from "@/components/CamposPreventivo";
import { FormularioComentario } from "@/components/FormularioComentario";
import { MarcarDesplazado } from "@/components/MarcarDesplazado";
import { Nav } from "@/components/Nav";
import { CENTROS, nombreCentroVisible, OTROS, type CentroNombre } from "@/domain/centros";
import { textoDetalle } from "@/domain/comentario";
import { hrefBandeja } from "@/domain/vista-bandeja";
import { puedeEditar, puedeVer } from "@/domain/acceso";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";
import { cambiarCentro, guardarComentario, guardarFechaPrevista, guardarSolicitudCr, marcarDesplazado } from "./actions";

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
  const centro = nombreCentroVisible(linea);
  const centroActual = (CENTROS as readonly string[]).includes(linea.centro?.nombre ?? "") ? (linea.centro?.nombre as CentroNombre) : "";
  const otros = linea.vin
    ? (await prisma.linea.findMany({ where: { vin: linea.vin, NOT: { id: linea.id } }, include: { centro: true } })).filter((o) => puedeVer(sesion, o))
    : [];

  return (
    <>
      <Nav bandeja={bandeja} />
      <main className="mx-auto max-w-3xl px-4 py-6">
      <Link className="text-sm text-slate-600 underline" href={bandeja}>
        Volver a la bandeja
      </Link>
      <article className="relative mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {linea.estadoIcss ? (
          <div className="absolute right-6 top-6 text-right">
            <p className="text-xs text-slate-500">Estado</p>
            <EstadoTag estado={linea.estadoIcss} />
          </div>
        ) : null}
        <div className={linea.estadoIcss ? "pr-24" : ""}>
          <h1 className="text-xl font-semibold">
            {linea.origen === "PREVENTIVO" ? "Preventivo" : "Control Room"} · {centro} · {linea.cliente}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{linea.expedienteId || linea.vin}</p>
        </div>
        {linea.prediagnostico ? (
          <div className="mt-4 rounded-md border border-slate-300 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Prediagnóstico</p>
            <p className="mt-1 text-base font-semibold leading-snug text-slate-950">{linea.prediagnostico}</p>
          </div>
        ) : null}
        <dl className="mt-4 grid gap-2 text-sm">
          <Dato k="VIN" v={linea.vin} suave />
          <Dato k="Matrícula" v={linea.matricula} suave />
          <Dato k="Modelo" v={linea.modelo} suave />
          {linea.centro2 ? <Dato k="Centro 2" v={linea.centro2} /> : null}
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

        {linea.origen === "PREVENTIVO" ? (
          <MarcarDesplazado
            key={String(linea.desplazado)}
            marcado={linea.desplazado}
            editar={editar}
            action={marcarDesplazado.bind(null, linea.id)}
          />
        ) : null}

        {linea.origen === "PREVENTIVO" ? (
          <ReasignarCentro
            key={linea.centro?.nombre ?? ""}
            centro={centroActual}
            editar={editar}
            action={cambiarCentro.bind(null, linea.id)}
          />
        ) : (
          <form action={cambiarCentro.bind(null, linea.id)} className="mt-6 flex items-end gap-2">
            <label className="text-sm font-medium">
              Reasignar centro
              <select name="centro" defaultValue={centroActual} disabled={!editar} className="mt-1 block rounded-md border border-slate-300 px-3 py-2">
                {centro === OTROS ? <option value="">{OTROS} · {linea.centro2}</option> : null}
                {CENTROS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            {editar ? <button className="rounded-md border border-slate-300 px-3 py-2 text-sm" type="submit">Pasar</button> : null}
          </form>
        )}

        {linea.cambios.length > 0 ? (
          <ul className="mt-3 text-xs text-slate-500">
            {linea.cambios.map((c) => (
              <li key={c.id}>
                {c.user.name}: {c.desde} → {c.hacia} · {c.createdAt.toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}
              </li>
            ))}
          </ul>
        ) : null}

        {linea.origen === "PREVENTIVO" && !linea.orFechaCita ? (
          <LlegadaPrevista
            key={`${linea.solicitarCr}-${linea.fechaPrevista ?? ""}`}
            solicitar={linea.solicitarCr}
            fecha={linea.fechaPrevista ?? ""}
            editar={editar}
            action={guardarSolicitudCr.bind(null, linea.id)}
          />
        ) : linea.orFechaCita ? (
          <p className="mt-6 text-sm">Cita de ICSS: {linea.orFechaCita}. Fecha de llegada prevista: {linea.fechaPrevista || "ninguna"}.</p>
        ) : (
          <form action={guardarFechaPrevista.bind(null, linea.id)} className="mt-6">
            <div className="flex items-end gap-2">
              <label className="text-sm font-medium">
                Fecha de llegada prevista
                <input name="fecha" type="date" defaultValue={linea.fechaPrevista ?? ""} disabled={!editar} className="mt-1 block rounded-md border border-slate-300 px-3 py-2" />
              </label>
              {editar ? <button className="rounded-md border border-slate-300 px-3 py-2 text-sm" type="submit">Guardar fecha</button> : null}
            </div>
            <p className="mt-1 text-xs text-red-600">Para que la fecha sea válida crear una cita en CAR</p>
          </form>
        )}

        <FormularioComentario
          action={guardarComentario.bind(null, linea.id)}
          texto={textoComentario}
          firma={
            linea.comentarioAt
              ? `${linea.comentarioUser?.name ?? "Alguien"} · ${linea.comentarioAt.toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}`
              : null
          }
          editar={editar}
        />
      </article>
      </main>
    </>
  );
}

function claseEstado(estado: string): string {
  const clave = estado.trim().toLowerCase();
  if (clave === "open") return "bg-sky-100 text-sky-950";
  if (clave === "billed") return "bg-emerald-100 text-emerald-950";
  if (clave === "closed") return "bg-slate-200 text-slate-700";
  return "bg-slate-100 text-slate-800";
}

function EstadoTag({ estado }: { estado: string }) {
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${claseEstado(estado)}`}>{estado}</span>;
}

function Dato({ k, v, suave = false }: { k: string; v: string; suave?: boolean }) {
  if (!v) return null;
  return (
    <div className={suave ? "text-xs" : ""}>
      <dt className="text-slate-500">{k}</dt>
      <dd className={suave ? "text-slate-600" : ""}>{v}</dd>
    </div>
  );
}
