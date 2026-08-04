"use client";

import Link from "next/link";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
          },
        });
        if (error) throw error;
        setMessage("Cuenta creada. Revisa tu correo y confirma el registro.");
        setMode("login");
        setPassword("");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "No fue posible completar la operación.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      setIsError(true);
      setMessage("Escribe primero tu correo.");
      return;
    }
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setMessage("Te enviamos un correo para recuperar tu contraseña.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "No fue posible enviar el correo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center">
        <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/85 p-7 shadow-2xl sm:p-9">
          <Link href="/" className="mb-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 to-indigo-400 text-xl font-black text-slate-950">π</span>
            <span><strong className="block text-xl">PAESLab</strong><small className="text-slate-400">Matemática M1 y M2</small></span>
          </Link>

          <div className="mb-7 grid grid-cols-2 rounded-2xl bg-slate-950/70 p-1">
            <button type="button" onClick={() => { setMode("login"); setMessage(""); }}
              className={`rounded-xl px-4 py-3 text-sm font-bold ${mode === "login" ? "bg-teal-300 text-slate-950" : "text-slate-400"}`}>
              Iniciar sesión
            </button>
            <button type="button" onClick={() => { setMode("signup"); setMessage(""); }}
              className={`rounded-xl px-4 py-3 text-sm font-bold ${mode === "signup" ? "bg-teal-300 text-slate-950" : "text-slate-400"}`}>
              Crear cuenta
            </button>
          </div>

          <h1 className="text-3xl font-black">{mode === "login" ? "Bienvenido nuevamente" : "Crea tu cuenta gratis"}</h1>
          <p className="mt-2 text-sm text-slate-400">{mode === "login" ? "Ingresa para continuar con tu progreso." : "Guarda tus resultados y continúa desde cualquier dispositivo."}</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {mode === "signup" && (
              <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 outline-none focus:border-teal-300" placeholder="Tu nombre" />
            )}
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 outline-none focus:border-teal-300" placeholder="Correo" />
            <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 outline-none focus:border-teal-300" placeholder="Contraseña" />

            {message && <div className={`rounded-xl border px-4 py-3 text-sm ${isError ? "border-rose-400/30 bg-rose-400/10 text-rose-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`}>{message}</div>}

            <button disabled={loading} className="w-full rounded-xl bg-teal-300 px-5 py-3.5 font-black text-slate-950 disabled:opacity-60">
              {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>

          {mode === "login" && (
            <button type="button" disabled={loading} onClick={handlePasswordReset}
              className="mt-5 w-full text-sm font-bold text-teal-300">
              Recuperar contraseña
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
