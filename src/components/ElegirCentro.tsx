"use client";

import { useRouter } from "next/navigation";

function chip(activo: boolean): string {
  return activo
    ? "rounded-full bg-slate-900 px-3 py-1 text-sm text-white"
    : "rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50";
}

export function ElegirCentro({
  seleccion,
  mes,
  opciones,
}: {
  seleccion: string[];
  mes: string;
  opciones: string[];
}) {
  const router = useRouter();

  function ir(centros: string[]) {
    const params = new URLSearchParams();
    for (const centro of centros) params.append("centro", centro);
    if (mes) params.set("mes", mes);
    const consulta = params.toString();
    router.push(consulta ? `/calendario?${consulta}` : "/calendario");
  }

  function alternar(nombre: string) {
    ir(seleccion.includes(nombre) ? seleccion.filter((c) => c !== nombre) : [...seleccion, nombre]);
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por centro">
      <button type="button" onClick={() => ir([])} className={chip(seleccion.length === 0)}>
        Todos
      </button>
      {opciones.map((nombre) => (
        <button key={nombre} type="button" onClick={() => alternar(nombre)} className={chip(seleccion.includes(nombre))}>
          {nombre}
        </button>
      ))}
    </div>
  );
}
