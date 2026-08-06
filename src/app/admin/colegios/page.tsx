"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import { createClient } from "@/lib/supabase/client";
import type { SchoolDirectoryEntry, SchoolVerificationStatus } from "@/types/school";

export default function SchoolDirectoryAdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [schools, setSchools] = useState<SchoolDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadSchools() {
    const { data, error } = await supabase
      .from("school_directory")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) setMessage(error.message);
    setSchools((data ?? []) as unknown as SchoolDirectoryEntry[]);
  }

  async function initialize() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/login");
      return;
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
    if (profile?.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    await loadSchools();
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initialize();
  }, []);

  async function updateStatus(id: string, verificationStatus: SchoolVerificationStatus) {
    setMessage("");
    const { error } = await supabase
      .from("school_directory")
      .update({
        verification_status: verificationStatus,
        is_active: verificationStatus !== "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) setMessage(error.message);
    await loadSchools();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader compact />
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-black text-sky-300">Administración</p>
            <h1 className="mt-2 text-4xl font-black">Directorio de colegios</h1>
            <p className="mt-4 max-w-3xl leading-7 text-slate-400">
              Revisa establecimientos aportados por estudiantes, verifica coincidencias reales o desactiva entradas incorrectas.
            </p>
          </div>
          <Link href="/admin" className="rounded-xl border border-white/15 px-5 py-3 font-black">Volver al administrador</Link>
        </div>

        {message && <p className="mt-6 rounded-xl bg-rose-300/10 p-4 text-rose-200">{message}</p>}
        {loading ? (
          <p className="mt-10 text-slate-400">Cargando directorio...</p>
        ) : (
          <div className="mt-10 space-y-4">
            {schools.map((school) => (
              <article key={school.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black">{school.name}</h2>
                      <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-black text-slate-300">{school.verification_status}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{school.commune} · {school.region}</p>
                    <p className="mt-2 text-xs text-slate-500">Fuente: {school.source_type}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void updateStatus(school.id, "verified")} className="rounded-xl bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950">Verificar</button>
                    <button type="button" onClick={() => void updateStatus(school.id, "community")} className="rounded-xl border border-sky-300/30 px-4 py-2 text-sm font-black text-sky-200">Comunitario</button>
                    <button type="button" onClick={() => void updateStatus(school.id, "inactive")} className="rounded-xl border border-rose-300/30 px-4 py-2 text-sm font-black text-rose-200">Desactivar</button>
                  </div>
                </div>
              </article>
            ))}
            {schools.length === 0 && <p className="rounded-2xl border border-white/10 p-6 text-slate-400">Todavía no hay colegios en el directorio.</p>}
          </div>
        )}
      </section>
    </main>
  );
}
