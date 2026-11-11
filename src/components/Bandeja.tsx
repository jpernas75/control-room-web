"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CENTROS } from "@/domain/centros";

export type FilaBandeja = {
  id: string;
  origen: "PREVENTIVO" | "CONTROL_ROOM";
  presencia: "ACTIVA" | "DESHABILITADA" | "ALERTA";
  expedienteId: string;
  vin: string;
  centro: string;
  cliente: string;
  vehiculo: string;
  detalle: string;
  situacionKey: string;
  situacionTexto: string;
  fase: string;
  estadoIcss: string;
  pago: string;
  fechaIso: string;
};

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

const ORDEN_SIT: Record<string, number> = {
  cerrar: 0,
  sinor: 1,
  llegada: 2,
  pendiente: 3,
  facturado: 4,
  cerrado: 5,
  alerta: 6,
  preventivo: 7,
  deshabilitada: 8,
};

type SortKey = "situacion" | "ref" | "centro" | "cliente" | "vehiculo" | "detalle" | "fecha";

type FiltroCr = {
  situacion: string;
  fase: string;
  estado: string;
  pago: string;
  detalle: string;
};

const FILTRO_VACIO: FiltroCr = { situacion: "", fase: "", estado: "", pago: "", detalle: "" };

function cmp(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base" });
}

function valor(fila: FilaBandeja, key: SortKey): string | number {
  if (key === "situacion") return ORDEN_SIT[fila.situacionKey] ?? 99;
  if (key === "ref") return fila.expedienteId || fila.vin;
  if (key === "centro") return fila.centro;
  if (key === "cliente") return fila.cliente;
  if (key === "vehiculo") return fila.vehiculo;
  if (key === "fecha") return fila.fechaIso;
  return fila.detalle;
}

function ordenar(filas: FilaBandeja[], key: SortKey, dir: "asc" | "desc"): FilaBandeja[] {
  const mul = dir === "asc" ? 1 : -1;
  return [...filas].sort((a, b) => {
    const va = valor(a, key);
    const vb = valor(b, key);
    const delta = typeof va === "number" && typeof vb === "number" ? va - vb : cmp(String(va), String(vb));
    return delta * mul;
  });
}

function unicos(filas: FilaBandeja[], pick: (f: FilaBandeja) => string): string[] {
  return [...new Set(filas.map(pick).map((v) => v.trim()).filter(Boolean))].sort((a, b) => cmp(a, b));
}

function recortar(texto: string, max: number): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1)}…` : limpio;
}

export function Bandeja({ filas }: { filas: FilaBandeja[] }) {
  const [centros, setCentros] = useState<string[]>([]);
  const [ocultarDeshabilitadas, setOcultarDeshabilitadas] = useState(false);
  const [ocultarAlertas, setOcultarAlertas] = useState(false);
  const [filtro, setFiltro] = useState<FiltroCr>(FILTRO_VACIO);
  const [sortCr, setSortCr] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "situacion", dir: "asc" });
  const [sortPrev, setSortPrev] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "situacion", dir: "asc" });

  const centrosVisibles = useMemo(() => {
    const presentes = new Set(filas.map((f) => f.centro));
    const lista: string[] = CENTROS.filter((c) => presentes.has(c));
    if (presentes.has("Sin centro")) lista.push("Sin centro");
    return lista;
  }, [filas]);

  const base = useMemo(() => {
    return filas.filter((f) => {
      if (ocultarDeshabilitadas && f.presencia === "DESHABILITADA") return false;
      if (ocultarAlertas && f.presencia === "ALERTA") return false;
      if (centros.length > 0 && !centros.includes(f.centro)) return false;
      return true;
    });
  }, [filas, centros, ocultarDeshabilitadas, ocultarAlertas]);

  const roomsBase = useMemo(() => base.filter((f) => f.origen === "CONTROL_ROOM"), [base]);
  const opciones = useMemo(
    () => ({
      situacion: unicos(roomsBase, (f) => f.situacionTexto),
      fase: unicos(roomsBase, (f) => f.fase),
      estado: unicos(roomsBase, (f) => f.estadoIcss),
      pago: unicos(roomsBase, (f) => f.pago),
      detalle: unicos(roomsBase, (f) => f.detalle),
    }),
    [roomsBase],
  );
  const situacion = opciones.situacion.includes(filtro.situacion) ? filtro.situacion : "";
  const fase = opciones.fase.includes(filtro.fase) ? filtro.fase : "";
  const estado = opciones.estado.includes(filtro.estado) ? filtro.estado : "";
  const pago = opciones.pago.includes(filtro.pago) ? filtro.pago : "";
  const detalle = opciones.detalle.includes(filtro.detalle) ? filtro.detalle : "";

  const rooms = ordenar(
    roomsBase.filter((f) => {
      if (situacion && f.situacionTexto !== situacion) return false;
      if (fase && f.fase !== fase) return false;
      if (estado && f.estadoIcss !== estado) return false;
      if (pago && f.pago !== pago) return false;
      if (detalle && f.detalle !== detalle) return false;
      return true;
    }),
    sortCr.key,
    sortCr.dir,
  );
  const preventivos = ordenar(
    base.filter((f) => f.origen === "PREVENTIVO"),
    sortPrev.key,
    sortPrev.dir,
  );

  function alternarCentro(nombre: string) {
    setCentros((prev) => (prev.includes(nombre) ? prev.filter((c) => c !== nombre) : [...prev, nombre]));
  }

  function onSort(cual: "cr" | "prev", key: SortKey) {
    const set = cual === "cr" ? setSortCr : setSortPrev;
    set((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "fecha" ? "desc" : "asc" }));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por centro">
        <button
          type="button"
          onClick={() => setCentros([])}
          className={chip(centros.length === 0)}
        >
          Todos
        </button>
        {centrosVisibles.map((nombre) => (
          <button key={nombre} type="button" onClick={() => alternarCentro(nombre)} className={chip(centros.includes(nombre))}>
            {nombre}
          </button>
        ))}
      </div>
      <div className="mb-4 flex gap-2 text-sm">
        <button type="button" onClick={() => setOcultarDeshabilitadas((v) => !v)} className="rounded-md border border-slate-200 bg-white px-3 py-1.5">
          {ocultarDeshabilitadas ? "Mostrar deshabilitados" : "Ocultar deshabilitados"}
        </button>
        <button type="button" onClick={() => setOcultarAlertas((v) => !v)} className="rounded-md border border-slate-200 bg-white px-3 py-1.5">
          {ocultarAlertas ? "Mostrar alertas" : "Ocultar alertas"}
        </button>
      </div>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-lg font-semibold">
          Control Room <span className="text-sm font-normal text-slate-500">{rooms.length}</span>
        </h2>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-4 py-3">
          <SelectFiltro label="Situación" value={situacion} options={opciones.situacion} onChange={(value) => setFiltro({ ...filtro, situacion: value })} />
          <SelectFiltro label="Estado" value={estado} options={opciones.estado} onChange={(value) => setFiltro({ ...filtro, estado: value })} />
          <SelectFiltro label="Fase" value={fase} options={opciones.fase} onChange={(value) => setFiltro({ ...filtro, fase: value })} />
          <SelectFiltro label="Pago" value={pago} options={opciones.pago} onChange={(value) => setFiltro({ ...filtro, pago: value })} />
          <SelectFiltro label="Detalle" value={detalle} options={opciones.detalle} largo onChange={(value) => setFiltro({ ...filtro, detalle: value })} />
        </div>
        <Tabla
          filas={rooms}
          sort={sortCr}
          onSort={(key) => onSort("cr", key)}
          refLabel="Expediente"
          vacio="No hay Control Room con estos filtros."
        />
      </section>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-lg font-semibold">
          Preventivos <span className="text-sm font-normal text-slate-500">{preventivos.length}</span>
        </h2>
        <Tabla
          filas={preventivos}
          sort={sortPrev}
          onSort={(key) => onSort("prev", key)}
          refLabel="VIN"
          vacio="No hay preventivos con estos filtros."
        />
      </section>
    </main>
  );
}

function chip(activo: boolean): string {
  return activo
    ? "rounded-full bg-slate-900 px-3 py-1 text-sm text-white"
    : "rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50";
}

function SelectFiltro({
  label,
  value,
  options,
  onChange,
  largo = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  largo?: boolean;
}) {
  return (
    <label className={`text-sm ${largo ? "min-w-[16rem] flex-1" : ""}`}>
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <select
        value={options.includes(value) ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-slate-300 bg-white px-3 py-2"
      >
        <option value="">Todos</option>
        {options.map((op) => (
          <option key={op} value={op} title={op}>
            {largo ? recortar(op, 80) : op}
          </option>
        ))}
      </select>
    </label>
  );
}

function Tabla({
  filas,
  sort,
  onSort,
  refLabel,
  vacio,
}: {
  filas: FilaBandeja[];
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
  refLabel: string;
  vacio: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-600">
          <tr>
            <SortTh label="Situación" sortKey="situacion" sort={sort} onSort={onSort} />
            <SortTh label={refLabel} sortKey="ref" sort={sort} onSort={onSort} />
            <SortTh label="Centro" sortKey="centro" sort={sort} onSort={onSort} />
            <SortTh label="Cliente" sortKey="cliente" sort={sort} onSort={onSort} />
            <SortTh label="Vehículo" sortKey="vehiculo" sort={sort} onSort={onSort} />
            <SortTh label="Detalle" sortKey="detalle" sort={sort} onSort={onSort} />
            <th className="sticky right-0 bg-slate-50 px-3 py-2 shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.2)]" />
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.id} className="border-t border-slate-100">
              <td className="px-3 py-2">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${AVISO[f.situacionKey] ?? "bg-slate-100"}`}>
                  {f.situacionTexto}
                </span>
              </td>
              <td className="px-3 py-2 font-medium">{f.expedienteId || f.vin}</td>
              <td className="px-3 py-2">{f.centro}</td>
              <td className="max-w-[12rem] truncate px-3 py-2" title={f.cliente}>{f.cliente}</td>
              <td className="px-3 py-2">{f.vehiculo}</td>
              <td className="max-w-[18rem] truncate px-3 py-2 text-slate-600" title={f.detalle}>{f.detalle}</td>
              <td className="sticky right-0 bg-white px-3 py-2 shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.25)]">
                <Link href={`/lineas/${f.id}`} className="inline-block rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
                  Gestionar
                </Link>
              </td>
            </tr>
          ))}
          {filas.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-slate-500" colSpan={7}>
                {vacio}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function SortTh({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
}) {
  const activo = sort.key === sortKey;
  return (
    <th className="px-3 py-2 font-medium">
      <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 hover:text-slate-900">
        {label}
        <span className="text-[10px] text-slate-400">{activo ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );
}
