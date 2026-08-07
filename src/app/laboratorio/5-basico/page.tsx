"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import { fifthGradeVisualLabs } from "@/data/fifth-grade-visual-labs";
import { createClient } from "@/lib/supabase/client";
import type { VisualLabProgressRow } from "@/types/visual-lab";

export default function FifthGradeLabsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [progress, setProgress] = useState<Record<string, VisualLabProgressRow>>({});
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    setSignedIn(Boolean(user));

    if (user) {
      const { data } = await supabase
        .from("student_visual_lab_progress")
        .select("lab_slug,attempts,last_score,best_score,completed,last_completed_at,updated_at")
        .eq("user_id", user.id);

      const map: Record<string, VisualLabProgressRow> = {};
      for (const row of (data ?? []) as VisualLabProgressRow[]) {
        map[row.lab_slug] = row;
      }
      setProgress(map);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const completed = fifthGradeVisualLabs.filter((lab) => progress[lab.slug]?.completed).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <div className="overflow-hidden rounded-[2.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.20),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.16),transparent_30%),linear-gradient(135deg,#0f172a,#020617)] p-7 sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-200">MathLabs · 5° básico</p>
          <div className="mt-4 grid gap-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black leading-tight sm:text-6xl">Laboratorios visuales</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                Aquí las matemáticas se mueven. Cambia controles, construye modelos y descubre qué ocurre antes de responder.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-sm font-black uppercase tracking-wide text-slate-500">Tu avance</p>
              <p className="mt-2 text-4xl font-black text-cyan-200">{completed}/{fifthGradeVisualLabs.length}</p>
              <p className="mt-2 text-sm text-slate-400">{signedIn ? "laboratorios superados" : "Inicia sesión para guardar resultados."}</p>
            </div>
          </div>
        </div>

        {loading ? <p className="mt-8 text-slate-400">Cargando laboratorios...</p> : null}

        <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {fifthGradeVisualLabs.map((lab, index) => {
            const item = progress[lab.slug];
            return (
              <Link
                key={lab.slug}
                href={`/laboratorio/5-basico/${lab.slug}`}
                className={`group rounded-[2rem] border border-white/10 bg-gradient-to-br ${lab.gradient} p-6 transition hover:-translate-y-1 hover:border-cyan-200/30`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-5xl">{lab.emoji}</span>
                  <span className="rounded-xl bg-slate-950/35 px-3 py-1 text-xs font-black text-slate-300">Lab {index + 1}</span>
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-wide text-slate-500">{lab.chapter}</p>
                <h2 className="mt-2 text-xl font-black text-white">{lab.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{lab.summary}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="font-black text-cyan-100">Entrar →</span>
                  {item ? <span className={`rounded-xl px-3 py-1 text-xs font-black ${item.completed ? "bg-emerald-300/15 text-emerald-200" : "bg-white/10 text-slate-300"}`}>{item.best_score}%</span> : null}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/aventura/5-basico" className="rounded-2xl border border-white/15 px-5 py-3 text-center font-black text-white">← Volver a la aventura</Link>
          <Link href="/matematica/5-basico" className="rounded-2xl border border-white/15 px-5 py-3 text-center font-black text-white">Ver curso completo</Link>
        </div>
      </section>
    </main>
  );
}
