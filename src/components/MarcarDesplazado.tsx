"use client";

export function MarcarDesplazado({
  marcado,
  editar,
  action,
}: {
  marcado: boolean;
  editar: boolean;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="mt-6">
      <label className="inline-flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="desplazado"
          value="1"
          defaultChecked={marcado}
          disabled={!editar}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="size-4 rounded border-slate-300"
        />
        Marcar como desplazado
      </label>
    </form>
  );
}
