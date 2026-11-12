"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function Boton({ guardado }: { guardado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="mt-2 flex items-center gap-3">
      <button
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "Guardando…" : "Guardar comentario"}
      </button>
      {guardado && !pending ? <span className="text-sm font-medium text-emerald-700">Guardado</span> : null}
    </div>
  );
}

export function FormularioComentario({
  action,
  texto,
  firma,
  editar,
}: {
  action: (formData: FormData) => void | Promise<void>;
  texto: string;
  firma: string | null;
  editar: boolean;
}) {
  const [guardado, setGuardado] = useState(false);

  return (
    <form
      className="mt-6"
      action={async (datos) => {
        await action(datos);
        setGuardado(true);
      }}
    >
      <label className="block text-sm font-medium">
        Comentario
        <textarea
          name="comentario"
          defaultValue={texto}
          rows={4}
          disabled={!editar}
          onChange={() => setGuardado(false)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </label>
      {firma ? (
        <p className="mt-1 text-xs text-slate-500">{firma}</p>
      ) : texto ? null : (
        <p className="mt-1 text-xs text-slate-500">Sin comentario</p>
      )}
      {editar ? <Boton guardado={guardado} /> : null}
    </form>
  );
}
