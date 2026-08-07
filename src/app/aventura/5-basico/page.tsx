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
