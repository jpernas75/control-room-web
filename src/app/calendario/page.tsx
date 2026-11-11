import Link from "next/link";
import { redirect } from "next/navigation";
import { marcasDeLinea, mesesConMarcas, type Marca } from "@/domain/calendario";
import { listarLineas } from "@/lib/lineas";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/sesion";

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
  searchParams: Promise<{ centro?: string; mes?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  const sp = await searchParams;
  const centros = await prisma.centro.findMany({ orderBy: { nombre: "asc" } });
  const todas = await listarLineas(sesion);
  const centroId = sesion.role === "CENTRO" ? sesion.centroId : sp.centro || centros[0]?.id || "";
  const delCentro = todas.filter((l) => l.centroId === centroId);
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
      new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" }),
    ).map((m) => ({ ...m, id: l.id, texto: [l.matricula || l.vin, l.cliente].filter(Boolean).join(" · ") })),
  );
  const meses = mesesConMarcas(marcas);
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" }).slice(0, 7);
  const mes = sp.mes && meses.includes(sp.mes) ? sp.mes : meses.at(-1) ?? hoy;
  const idx = meses.indexOf(mes);
  const href = (m: string) => `/calendario?centro=${centroId}&mes=${m}`;

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {sesion.role === "ADMIN" ? (
          <form>
            <select name="centro" defaultValue={centroId ?? ""} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              {centros.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <button className="ml-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" type="submit">Ver</button>
          </form>
        ) : null}
        {idx > 0 ? <Link className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm" href={href(meses[idx - 1])}>Anterior</Link> : null}
        <strong>{mes}</strong>
        {idx >= 0 && idx < meses.length - 1 ? (
          <Link className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm" href={href(meses[idx + 1])}>Siguiente</Link>
        ) : null}
        <form action="/calendario" className="flex items-center gap-2">
          <input type="hidden" name="centro" value={centroId ?? ""} />
          <select name="mes" defaultValue={mes} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm">
            {(meses.length ? meses : [mes]).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <button className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm" type="submit">Ir</button>
        </form>
      </div>
      {marcas.length === 0 ? <p className="text-sm text-slate-600">Este centro no tiene citas ni órdenes en el calendario.</p> : null}
      <Mes mes={mes} marcas={marcas} />
    </main>
  );
}

function Mes({
  mes,
  marcas,
}: {
  mes: string;
  marcas: (Marca & { id: string; texto: string })[];
}) {
  const [y, m] = mes.split("-").map(Number);
  const primero = new Date(Date.UTC(y, m - 1, 1));
  const huecos = (primero.getUTCDay() + 6) % 7;
  const dias = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const celdas = [...Array(huecos).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)];
  return (
    <div className="grid grid-cols-7 gap-2">
      {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
        <div key={d} className="text-center text-xs text-slate-500">{d}</div>
      ))}
      {celdas.map((dia, i) => {
        const iso = dia ? `${mes}-${String(dia).padStart(2, "0")}` : "";
        const delDia = dia ? marcas.filter((marca) => marca.desde <= iso && marca.hasta >= iso) : [];
        return (
          <div key={i} className="min-h-24 rounded-md border border-slate-200 bg-white p-1">
            <div className="text-xs text-slate-400">{dia ?? ""}</div>
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
