"use client";

import { useActionState } from "react";
import { procesar, type EstadoImport } from "./actions";

export function FormularioImport({ tipo, titulo }: { tipo: "json" | "excel"; titulo: string }) {
  const [state, action, pending] = useActionState<EstadoImport, FormData>(procesar, null);
  return (
    <form action={action} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <input type="hidden" name="tipo" value={tipo} />
      <input name="file" type="file" accept={tipo === "json" ? ".json,application/json" : ".xlsx,.xls"} required className="mt-3 block text-sm" />
      <div className="mt-3 flex gap-2">
        <button name="intent" value="preview" disabled={pending} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm" type="submit">
          Vista previa
        </button>
        <button name="intent" value="confirm" disabled={pending} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white" type="submit">
          Confirmar e importar
        </button>
      </div>
      {state?.error ? <p className="mt-3 text-sm text-rose-700">{state.error}</p> : null}
      {state?.texto ? <p className="mt-3 text-sm text-slate-700">{state.texto}</p> : null}
    </form>
  );
}
