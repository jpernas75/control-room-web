import { redirect } from "next/navigation";
import { sesionActual } from "@/lib/sesion";
import { FormularioImport } from "./form";

export const dynamic = "force-dynamic";

export default async function Importar() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");
  if (sesion.role !== "ADMIN") redirect("/");
  return (
    <main className="mx-auto grid max-w-3xl gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Importar</h1>
      <p className="text-sm text-slate-600">La vista previa no escribe. Confirmar vuelve a leer el fichero y guarda.</p>
      <FormularioImport tipo="json" titulo="JSON de ICSS-ANS24" />
      <FormularioImport tipo="excel" titulo="Excel de preventivos VCO" />
    </main>
  );
}
