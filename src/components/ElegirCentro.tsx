"use client";

export function ElegirCentro({
  centro,
  mes,
  opciones,
}: {
  centro: string;
  mes: string;
  opciones: { id: string; nombre: string }[];
}) {
  return (
    <form>
      <input type="hidden" name="mes" value={mes} />
      <select
        name="centro"
        defaultValue={centro}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="Centro"
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="todos">Todos</option>
        {opciones.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
    </form>
  );
}
