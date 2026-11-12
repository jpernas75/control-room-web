"use client";

import { useState } from "react";
import { CENTROS } from "@/domain/centros";

export function ReasignarCentro({
  centro,
  editar,
  action,
}: {
  centro: string;
  editar: boolean;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="mt-6">
      <label className="text-sm font-medium">
        Reasignar centro
        <select
          name="centro"
          defaultValue={centro}
          disabled={!editar}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="mt-1 block rounded-md border border-slate-300 px-3 py-2"
        >
          {CENTROS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
    </form>
  );
}

export function LlegadaPrevista({
  solicitar,
  fecha,
  editar,
  action,
}: {
  solicitar: boolean;
  fecha: string;
  editar: boolean;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [pedido, setPedido] = useState(solicitar);
  const [dia, setDia] = useState(fecha);

  function enviar(siguientePedido: boolean, siguienteFecha: string) {
    const datos = new FormData();
    if (siguientePedido) datos.set("solicitar", "1");
    datos.set("fecha", siguienteFecha);
    void action(datos);
  }

  return (
    <div className="mt-6">
      <label className="inline-flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={pedido}
          disabled={!editar}
          onChange={(e) => {
            const on = e.target.checked;
            setPedido(on);
            enviar(on, dia);
          }}
          className="size-4 rounded border-slate-300"
        />
        Solicitar Control Room
      </label>
      <label className="mt-4 block text-sm font-medium">
        Fecha de llegada prevista
        <input
          type="date"
          value={dia}
          disabled={!editar}
          onChange={(e) => {
            setDia(e.target.value);
            enviar(pedido, e.target.value);
          }}
          className="mt-1 block rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50"
        />
      </label>
      <p className="mt-1 text-xs text-red-600">Para que la fecha sea válida crear una cita en CAR</p>
    </div>
  );
}
