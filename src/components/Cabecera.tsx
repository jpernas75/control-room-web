"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

function IconoControl() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-7 shrink-0 text-slate-900"
      aria-hidden
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}

function clasePestana(activa: boolean): string {
  return activa
    ? "rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm"
    : "rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50";
}

function hrefBandeja(pathname: string, bandeja: string): string {
  if (pathname.startsWith("/calendario")) {
    const params = new URLSearchParams();
    for (const centro of new URLSearchParams(window.location.search).getAll("centro")) params.append("centro", centro);
    const consulta = params.toString();
    return consulta ? `/?${consulta}` : "/";
  }
  if (pathname === "/") return window.location.search ? `/${window.location.search}` : "/";
  return bandeja;
}

function hrefCalendario(pathname: string): string {
  const actual = new URLSearchParams(window.location.search);
  if (pathname.startsWith("/calendario")) return `/calendario${window.location.search}`;
  const origen = pathname === "/" ? actual : pathname.startsWith("/lineas") ? new URLSearchParams(actual.get("volver") ?? "") : null;
  if (!origen) return "/calendario";
  const params = new URLSearchParams();
  for (const centro of origen.getAll("centro")) params.append("centro", centro);
  const consulta = params.toString();
  return consulta ? `/calendario?${consulta}` : "/calendario";
}

function Pestana({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const activa = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={clasePestana(activa)}>
      {label}
    </Link>
  );
}

function EnlaceBandeja({
  pathname,
  bandeja,
  className,
  children,
  pestana = false,
}: {
  pathname: string;
  bandeja: string;
  className?: string;
  children: ReactNode;
  pestana?: boolean;
}) {
  const router = useRouter();
  const activa = pathname === "/" || pathname.startsWith("/lineas");
  return (
    <Link
      href={bandeja}
      className={pestana ? clasePestana(activa) : className}
      onClick={(e) => {
        if (pathname !== "/" && !pathname.startsWith("/calendario")) return;
        e.preventDefault();
        router.push(hrefBandeja(pathname, bandeja));
      }}
    >
      {children}
    </Link>
  );
}

function PestanaCalendario({ pathname }: { pathname: string }) {
  const router = useRouter();
  const activa = pathname === "/calendario" || pathname.startsWith("/calendario/");
  return (
    <Link
      href="/calendario"
      className={clasePestana(activa)}
      onClick={(e) => {
        e.preventDefault();
        router.push(hrefCalendario(pathname));
      }}
    >
      Calendario
    </Link>
  );
}

export function Cabecera({
  nombre,
  admin,
  json,
  excel,
  bandeja,
}: {
  nombre: string;
  admin: boolean;
  json: string;
  excel: string;
  bandeja: string;
}) {
  const pathname = usePathname() || "/";
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <EnlaceBandeja pathname={pathname} bandeja={bandeja} className="flex shrink-0 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-inturasa.png" alt="Inturasa" width={340} height={114} className="h-[4.5rem] w-auto" />
            <span className="flex items-center gap-2 text-lg font-medium text-slate-900">
              <IconoControl />
              Control Room
            </span>
          </EnlaceBandeja>
          <nav className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1" aria-label="Apartados">
            <EnlaceBandeja pathname={pathname} bandeja={bandeja} pestana>
              Bandeja
            </EnlaceBandeja>
            <PestanaCalendario pathname={pathname} />
            {admin ? (
              <>
                <Pestana href="/importar" label="Importar" pathname={pathname} />
                <Pestana href="/admin/centros" label="Centros" pathname={pathname} />
              </>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>
            {nombre}
            <span className="text-slate-400"> · JSON {json} · Excel {excel}</span>
          </span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
