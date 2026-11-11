"use client";

import { useActionState, useState } from "react";
import { procesar, type EstadoImport } from "./actions";

export function FormularioImport({ tipo, titulo }: { tipo: "json" | "excel"; titulo: string }) {
  const [state, action, pending] = useActionState<EstadoImport, FormData>(procesar, null);
  const [fase, setFase] = useState<"preview" | "confirm">("preview");
  const [nombre, setNombre] = useState("");

  function alEnviar(event: React.FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    setFase(submitter instanceof HTMLButtonElement && submitter.value === "confirm" ? "confirm" : "preview");
    const input = event.currentTarget.elements.namedItem("file");
    setNombre(input instanceof HTMLInputElement ? (input.files?.[0]?.name ?? "") : "");
  }

  const trabajando = fase === "confirm" ? "Importando el archivo" : "Preparando la vista previa";

  return (
    <form action={action} onSubmit={alEnviar} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-busy={pending}>
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <input type="hidden" name="tipo" value={tipo} />
      <input
        name="file"
        type="file"
        accept={tipo === "json" ? ".json,application/json" : ".xlsx,.xls"}
        required
        disabled={pending}
        className="mt-3 block text-sm disabled:opacity-60"
      />
      <div className="mt-3 flex gap-2">
        <button name="intent" value="preview" disabled={pending} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-60" type="submit">
          {pending && fase === "preview" ? "Leyendo…" : "Vista previa"}
        </button>
        <button name="intent" value="confirm" disabled={pending} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-60" type="submit">
          {pending && fase === "confirm" ? "Importando…" : "Confirmar e importar"}
        </button>
      </div>
      {pending ? (
        <div className="mt-4 space-y-2" role="status" aria-live="polite">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" aria-hidden />
            <span>
              {trabajando}
              {nombre ? ` · ${nombre}` : ""}…
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-busy="true" aria-label={trabajando}>
            <div className="h-full w-full animate-pulse rounded-full bg-slate-700/80" />
          </div>
          <p className="text-xs text-slate-500">No cierres esta página. Si el fichero es grande, puede tardar un momento.</p>
        </div>
      ) : null}
      {!pending && state?.error ? <p className="mt-3 text-sm text-rose-700">{state.error}</p> : null}
      {!pending && state?.texto ? <p className="mt-3 text-sm text-slate-700">{state.texto}</p> : null}
    </form>
  );
}
