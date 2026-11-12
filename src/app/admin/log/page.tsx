import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { esCuentaAdministrador, sesionActual } from "@/lib/sesion";

export const dynamic = "force-dynamic";

function fecha(d: Date): string {
  return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "medium", timeZone: "Europe/Madrid" });
}

export default async function LogAccesos() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  if (!(await esCuentaAdministrador())) redirect("/");
  const accesos = await prisma.acceso.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: { select: { name: true, username: true } } },
  });
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Log</h1>
        <p className="mt-1 text-sm text-slate-600">Inicios de sesión, del más reciente al más antiguo. La hora es la de Madrid.</p>
        {accesos.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">Todavía no hay accesos registrados.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Usuario</th>
                  <th className="px-3 py-2 font-medium">Cuenta</th>
                  <th className="px-3 py-2 font-medium">Fecha y hora</th>
                </tr>
              </thead>
              <tbody>
                {accesos.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{a.user.name}</td>
                    <td className="px-3 py-2 text-slate-600">{a.user.username}</td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{fecha(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
