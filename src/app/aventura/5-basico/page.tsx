"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import MathLabsGuide from "@/components/mathlabs/MathLabsGuide";
import FifthGradeAdventureMap, {
  fifthGradeTomoOneChapters,
} from "@/components/mathlabs/FifthGradeAdventureMap";
import { createClient } from "@/lib/supabase/client";

type ReviewSessionRow = {
  review_set_id: string;
  score_percent: number;
};

export default function FifthGradeAdventurePage() {
  const supabase = useMemo(() => createClient(), []);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [reviewScores, setReviewScores] = useState<Record<string, number>>({});
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    setSignedIn(Boolean(user));

    if (!user) {
      setLoading(false);
      return;
    }

    const lessonIds = Array.from(
      new Set(fifthGradeTomoOneChapters.flatMap((chapter) => chapter.lessonIds)),
    );

    const [{ data: progressData }, { data: reviewData }] = await Promise.all([
      supabase
        .from("lesson_progress")
        .select("lesson_id,status")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .in("lesson_id", lessonIds),
      supabase
        .from("school_review_sessions")
        .select("review_set_id,score_percent,completed_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .in("review_set_id", ["tomo1-unidad1", "tomo1-unidad2"])
        .order("completed_at", { ascending: false }),
    ]);

    setCompletedLessonIds(
      (progressData ?? []).map((row) => String(row.lesson_id)),
    );

    const scores: Record<string, number> = {};
    for (const row of (reviewData ?? []) as ReviewSessionRow[]) {
      if (scores[row.review_set_id] === undefined) {
        scores[row.review_set_id] = row.score_percent;
      }
    }
    setReviewScores(scores);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        Preparando tu aventura...
      </main>
    );
  }

  const completedSet = new Set(completedLessonIds);
  const firstPending = fifthGradeTomoOneChapters.find(
    (chapter) => !chapter.lessonIds.every((id) => completedSet.has(id)),
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.15),transparent_30%),linear-gradient(135deg,#0f172a,#020617)] p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-200">
                MathLabs · 5° básico
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
                Aventura Matemática
                <span className="block bg-gradient-to-r from-cyan-200 via-indigo-200 to-fuchsia-200 bg-clip-text text-transparent">
                  Tomo 1
                </span>
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                Recorre nueve capítulos con explicaciones visuales, práctica guiada,
                desafíos y seguimiento de tu avance.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {firstPending ? (
                  <Link
                    href={`/aprender/leccion/${firstPending.lessonSlug}`}
                    className="rounded-2xl bg-cyan-300 px-6 py-4 text-center font-black text-slate-950"
                  >
                    Continuar en capítulo {firstPending.number} →
                  </Link>
                ) : (
                  <Link
                    href="/repaso-escolar/tomo-1-unidad-2"
                    className="rounded-2xl bg-emerald-300 px-6 py-4 text-center font-black text-slate-950"
                  >
                    Completar desafío final →
                  </Link>
                )}
                <Link
                  href="/matematica/5-basico"
                  className="rounded-2xl border border-white/15 px-6 py-4 text-center font-black text-white"
                >
                  Ver curso completo
                </Link>
              </div>
            </div>
            <MathLabsGuide
              message={
                signedIn
                  ? "Yo iré marcando tus capítulos completados y te mostraré el siguiente paso. No necesitas aprender todo de una vez: avanza misión por misión."
                  : "Puedes explorar todo el mapa. Inicia sesión para guardar capítulos, puntajes y desafíos completados."
              }
            />
          </div>
        </div>

        {!signedIn ? (
          <div className="mt-7 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5 text-amber-100">
            <p className="font-black">Tu progreso todavía no se está guardando.</p>
            <p className="mt-2 text-sm leading-6 text-amber-100/80">
              Inicia sesión para conservar tus lecciones y resultados.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-xl bg-amber-300 px-4 py-2 text-sm font-black text-slate-950"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : null}

        <Link
          href="/laboratorio/5-basico"
          className="mt-8 block overflow-hidden rounded-[2.25rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_32%),linear-gradient(135deg,rgba(14,116,144,0.16),rgba(76,29,149,0.10))] p-6 transition hover:border-cyan-200/40 sm:p-7"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-cyan-300/10 text-4xl">🧪</div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Nuevo · aprende haciendo</p>
                <h2 className="mt-2 text-2xl font-black text-white">Laboratorios visuales</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Manipula números, grupos, medidas, fracciones, patrones y gráficos. Luego supera una misión corta y guarda tu mejor resultado.
                </p>
              </div>
            </div>
            <span className="rounded-2xl bg-cyan-300 px-5 py-3 text-center font-black text-slate-950">Explorar laboratorios →</span>
          </div>
        </Link>

        <div className="mt-10">
          <FifthGradeAdventureMap
            completedLessonIds={completedSet}
            reviewScores={reviewScores}
          />
        </div>
      </section>
    </main>
  );
}
