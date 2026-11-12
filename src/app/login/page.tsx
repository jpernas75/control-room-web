"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function Formulario() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      username: String(data.get("username") ?? ""),
      password: String(data.get("password") ?? ""),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Cuenta o clave incorrectas");
      return;
    }
    router.push(params.get("callbackUrl") || "/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Gestión Control Room</h1>
        <p className="mt-1 text-sm text-slate-500">Cuenta del centro o del administrador.</p>
        <label className="mt-6 block text-sm font-medium">
          Cuenta
          <input name="username" autoComplete="username" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Clave
          <input name="password" type="password" autoComplete="current-password" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        <button disabled={loading} className="mt-6 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white" type="submit">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <Formulario />
    </Suspense>
  );
}
