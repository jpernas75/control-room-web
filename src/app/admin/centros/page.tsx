import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { esCuentaAdministrador, sesionActual } from "@/lib/sesion";
import { guardarClave } from "./actions";

export const dynamic = "force-dynamic";

export default async function Usuarios() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  if (!(await esCuentaAdministrador())) redirect("/");
  const usuarios = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="mt-1 text-sm text-slate-600">La cuenta es el nombre en minúsculas. La clave nueva tiene al menos 8 caracteres.</p>
        <ul className="mt-4 space-y-3">
          {usuarios.map((u) => (
            <li key={u.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <form action={guardarClave} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="username" value={u.username} />
                <div>
                  <p className="text-sm font-medium">
                    {u.name}
                    <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {u.role === "ADMIN" ? "Administrador" : "Centro"}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">Usuario {u.username} · {u.passwordHash ? "con clave" : "sin clave"}</p>
                </div>
                <input name="password" type="password" minLength={8} required autoComplete="new-password" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <button className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white" type="submit">Guardar</button>
              </form>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
