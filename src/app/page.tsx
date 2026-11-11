import Link from "next/link";
import { redirect } from "next/navigation";
import { listarLineas } from "@/lib/lineas";
import { sesionActual } from "@/lib/sesion";

export const dynamic = "force-dynamic";

const AVISO: Record<string, string> = {
  deshabilitada: "bg-slate-200 text-slate-700",
  alerta: "bg-amber-100 text-amber-950",
  preventivo: "bg-amber-50 text-amber-900",
  cerrar: "bg-sky-100 text-sky-950",
  sinor: "bg-rose-100 text-rose-950",
  llegada: "bg-sky-50 text-sky-900",
  pendiente: "bg-slate-100 text-slate-700",
  facturado: "bg-emerald-100 text-emerald-950",
  cerrado: "bg-emerald-50 text-emerald-900",
};

export default async function Bandeja({ searchParams }: { searchParams: Promise<{ ocultar?: string }> }) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  const ocultar = new Set(((await searchParams).ocultar ?? "").split(",").filter(Boolean));
  const lineas = (await listarLineas(sesion)).filter((l) => {
    if (ocultar.has("deshabilitadas") && l.presencia === "DESHABILITADA") return false;
    if (ocultar.has("alertas") && l.presencia === "ALERTA") return false;
    return true;
  });
  const preventivos = lineas.filter((l) => l.origen === "PREVENTIVO");
  const rooms = lineas.filter((l) => l.origen === "CONTROL_ROOM");
  const q = (clave: string) => {
    const next = new Set(ocultar);
    if (next.has(clave)) next.delete(clave);
    else next.add(clave);
    const value = [...next].join(",");
    return value ? `/?ocultar=${value}` : "/";
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex gap-2 text-sm">
        <Link className="rounded-md border border-slate-200 bg-white px-3 py-1.5" href={q("deshabilitadas")}>
          {ocultar.has("deshabilitadas") ? "Mostrar deshabilitados" : "Ocultar deshabilitados"}
        </Link>
        <Link className="rounded-md border border-slate-200 bg-white px-3 py-1.5" href={q("alertas")}>
          {ocultar.has("alertas") ? "Mostrar alertas" : "Ocultar alertas"}
        </Link>
      </div>
      <Bloque titulo="Preventivos" filas={preventivos} />
      <Bloque titulo="Control Room" filas={rooms} />
    </main>
  );
}

function Bloque({
  titulo,
  filas,
}: {
  titulo: string;
  filas: Awaited<ReturnType<typeof listarLineas>>;
}) {
  return (
    <section className="mb-8 rounded-lg border border-slate-200 bg-white shadow-sm">
      <h2 className="border-b border-slate-200 px-4 py-3 text-lg font-semibold">
        {titulo} <span className="text-sm font-normal text-slate-500">{filas.length}</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Situación</th>
              <th className="px-3 py-2">Expediente / VIN</th>
              <th className="px-3 py-2">Centro</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Vehículo</th>
              <th className="px-3 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${AVISO[f.situacion.key] ?? "bg-slate-100"}`}>
                    {f.situacion.texto}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <Link className="font-medium underline" href={`/lineas/${f.id}`}>
                    {f.expedienteId || f.vin}
                  </Link>
                </td>
                <td className="px-3 py-2">{f.centro?.nombre ?? "Sin centro"}{f.centroManual ? " · corregido" : ""}</td>
                <td className="px-3 py-2">{f.cliente}</td>
                <td className="px-3 py-2">{[f.matricula, f.modelo].filter(Boolean).join(" · ")}</td>
                <td className="px-3 py-2 text-slate-600">{f.origen === "PREVENTIVO" ? f.obs || f.trigger : f.prediagnostico}</td>
              </tr>
            ))}
            {filas.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-slate-500" colSpan={6}>
                  No hay líneas en este bloque.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
