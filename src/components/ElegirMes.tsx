"use client";

import { useRouter } from "next/navigation";

export function ElegirMes({ mes, meses, centros }: { mes: string; meses: string[]; centros: string[] }) {
  const router = useRouter();

  function ir(siguiente: string) {
    const params = new URLSearchParams();
    for (const centro of centros) params.append("centro", centro);
    params.set("mes", siguiente);
    router.push(`/calendario?${params}`);
  }

  return (
    <select
      aria-label="Mes"
      value={mes}
      onChange={(e) => ir(e.target.value)}
      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
    >
      {meses.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}
