import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function fecha(d: Date | undefined) {
  if (!d) return "sin importar";
  return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Madrid" });
}

export async function Nav() {
  const sesion = await auth();
  if (!sesion?.user) return null;
  const [json, excel] = await Promise.all([
    prisma.importBatch.findFirst({ where: { tipo: "JSON" }, orderBy: { createdAt: "desc" } }),
    prisma.importBatch.findFirst({ where: { tipo: "EXCEL" }, orderBy: { createdAt: "desc" } }),
  ]);
  const admin = sesion.user.role === "ADMIN";
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="text-sm font-semibold text-slate-900">
          Gestión Control Room
        </Link>
        <nav className="flex flex-wrap gap-2">
          <Link className="rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white" href="/">
            Bandeja
          </Link>
          <Link className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700" href="/calendario">
            Calendario
          </Link>
          {admin ? (
            <>
              <Link className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700" href="/importar">
                Importar
              </Link>
              <Link className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700" href="/admin/centros">
                Centros
              </Link>
            </>
          ) : null}
        </nav>
        <p className="ml-auto text-xs text-slate-500">
          {sesion.user.name} · JSON {fecha(json?.createdAt)} · Excel {fecha(excel?.createdAt)}
        </p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="text-sm text-slate-600 underline" type="submit">
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
