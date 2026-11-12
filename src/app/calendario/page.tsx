import Link from "next/link";
import { redirect } from "next/navigation";
import { ElegirCentro } from "@/components/ElegirCentro";
import { Nav } from "@/components/Nav";
import { CENTROS } from "@/domain/centros";
import { marcasDeLinea, mesesCompletos, mesesConMarcas, type Marca } from "@/domain/calendario";
import { listarLineas } from "@/lib/lineas";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";

const RAYA = "bg-[repeating-linear-gradient(-45deg,#e2e8f0_0px,#e2e8f0_6px,#ffffff_6px,#ffffff_12px)]";

function lista(valor: string | string[] | undefined): string[] {
  if (!valor) return [];
  return Array.isArray(valor) ? valor : [valor];
}

function nombresCentro(valor: string | string[] | undefined, porId: Map<string, string>, validos: Set<string>): string[] {
  const nombres = lista(valor)
    .map((v) => v.trim())
    .filter((v) => v && v !== "todos")
    .map((v) => porId.get(v) ?? v)
    .filter((v) => validos.has(v));
  return [...new Set(nombres)];
}

function hrefMes(mes: string, centros: string[]): string {
  const params = new URLSearchParams();
  for (const centro of centros) params.append("centro", centro);
  params.set("mes", mes);
  return `/calendario?${params}`;
}

export const dynamic = "force-dynamic";

const COLOR: Record<Marca["tipo"], string> = {
  prevista: "bg-amber-100 text-amber-950",
  cita: "bg-sky-100 text-sky-950",
  cita_pasada: "bg-rose-100 text-rose-950",
  en_taller: "bg-violet-100 text-violet-950",
  realizada: "bg-emerald-100 text-emerald-950",
};

export default async function Calendario({
  searchParams,
}: {
  searchParams: Promise<{ centro?: string | string[]; mes?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  const sp = await searchParams;
  const catalogo = await prisma.centro.findMany();
  const todas = await listarLineas(sesion);
  const admin = sesion.role === "ADMIN";
  const porId = new Map(catalogo.map((c) => [c.id, c.nombre]));
  const opciones = [...CENTROS, ...(todas.some((l) => !l.centro) ? ["Sin centro" as const] : [])];
  const seleccion = admin ? nombresCentro(sp.centro, porId, new Set(opciones)) : [];
  const delCentro = seleccion.length === 0 ? todas : todas.filter((l) => seleccion.includes(l.centro?.nombre ?? "Sin centro"));
  const fechaHoy = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
  const marcas = delCentro.flatMap((l) =>
    marcasDeLinea(
      {
        presencia: l.presencia,
        fechaPrevista: l.fechaPrevista,
        orCita: l.orCita,
        orEstado: l.orEstado || null,
        orFecha: l.orFecha || null,
        orFechaCita: l.orFechaCita || null,
        orFechaEntrega: l.orFechaEntrega || null,
      },
      fechaHoy,
    ).map((m) => ({ ...m, id: l.id, texto: [l.matricula || l.vin, l.cliente].filter(Boolean).join(" · ") })),
  );
  const hoy = fechaHoy.slice(0, 7);
  const conDatos = mesesConMarcas(
    todas.flatMap((l) =>
      marcasDeLinea(
        {
          presencia: l.presencia,
          fechaPrevista: l.fechaPrevista,
          orCita: l.orCita,
          orEstado: l.orEstado || null,
          orFecha: l.orFecha || null,
          orFechaCita: l.orFechaCita || null,
          orFechaEntrega: l.orFechaEntrega || null,
        },
        fechaHoy,
      ),
    ),
  );
  const meses = mesesCompletos(conDatos, hoy);
  const mes = sp.mes && meses.includes(sp.mes) ? sp.mes : conDatos.at(-1) ?? hoy;
  const idx = meses.indexOf(mes);
  const href = (m: string) => hrefMes(m, seleccion);

  return (
    <>
    <Nav />
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">
      {admin ? <div className="mb-4"><ElegirCentro seleccion={seleccion} mes={mes} opciones={opciones} /></div> : null}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {idx > 0 ? <Link className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm" href={href(meses[idx - 1])}>Anterior</Link> : null}
        <strong>{mes}</strong>
        {idx >= 0 && idx < meses.length - 1 ? (
          <Link className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm" href={href(meses[idx + 1])}>Siguiente</Link>
        ) : null}
        <form action="/calendario" className="flex items-center gap-2">
          {seleccion.map((centro) => (
            <input key={centro} type="hidden" name="centro" value={centro} />
          ))}
          <select name="mes" defaultValue={mes} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm">
            {meses.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm" type="submit">Ir</button>
        </form>
      </div>
      {marcas.length === 0 ? (
        <p className="mb-4 text-sm text-slate-600">No hay citas ni órdenes en el calendario.</p>
      ) : null}
      <Mes mes={mes} marcas={marcas} hoy={fechaHoy} />
    </main>
    </>
  );
}

function Mes({
  mes,
  marcas,
  hoy,
}: {
  mes: string;
  marcas: (Marca & { id: string; texto: string })[];
  hoy: string;
}) {
  const [y, m] = mes.split("-").map(Number);
  const primero = new Date(Date.UTC(y, m - 1, 1));
  const huecos = (primero.getUTCDay() + 6) % 7;
  const dias = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const celdas = [...Array(huecos).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];
  return (
    <div className="grid grid-cols-7 gap-2">
      {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
        <div key={d} className={`rounded-md py-1 text-center text-xs text-slate-500 ${i >= 5 ? RAYA : ""}`}>{d}</div>
      ))}
      {celdas.map((dia, i) => {
        const iso = dia ? `${mes}-${String(dia).padStart(2, "0")}` : "";
        const esHoy = iso === hoy;
        const finDeSemana = i % 7 >= 5;
        const delDia = dia ? marcas.filter((marca) => marca.desde <= iso && marca.hasta >= iso) : [];
        return (
          <div key={i} className={`min-h-24 rounded-md border p-1 ${esHoy ? "border-slate-900" : "border-slate-200"} ${finDeSemana ? RAYA : esHoy ? "bg-slate-50" : "bg-white"}`}>
            <div className={esHoy ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-xs font-semibold text-white" : "text-xs text-slate-400"} aria-current={esHoy ? "date" : undefined}>{dia ?? ""}</div>
            {delDia.map((marca, n) => (
              <Link
                key={`${marca.id}-${n}`}
                href={`/lineas/${marca.id}`}
                className={`mt-1 block rounded px-1 text-xs ${marca.deshabilitada ? "bg-slate-200 text-slate-700" : COLOR[marca.tipo]}`}
              >
                {marca.texto}
                {marca.deshabilitada ? " · Ya no aparece en ICSS" : ""}
              </Link>
            ))}
          </div>
        );
      })}
    </div>
  );
}
