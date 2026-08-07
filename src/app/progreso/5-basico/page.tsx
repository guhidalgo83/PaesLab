"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import LearningTrendChart from "@/components/mathlabs/LearningTrendChart";
import ProgressRing from "@/components/mathlabs/ProgressRing";
import { createClient } from "@/lib/supabase/client";
import type { LearningHubData, LearningTrendPoint } from "@/types/learning-os";

function color(value: number) {
  if (value >= 80) return "from-emerald-300 to-teal-300";
  if (value >= 50) return "from-amber-300 to-yellow-300";
  if (value > 0) return "from-orange-300 to-rose-300";
  return "from-slate-700 to-slate-600";
}

export default function FifthGradeProgressPage() {
  const supabase = useMemo(() => createClient(), []);
  const [hub, setHub] = useState<LearningHubData | null>(null);
  const [trend, setTrend] = useState<LearningTrendPoint[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const [{ data: hubData, error: hubError }, { data: trendData, error: trendError }] = await Promise.all([
      supabase.rpc("get_my_learning_hub", { p_course_id: "cl-5-basico" }),
      supabase.rpc("get_my_learning_trend", { p_course_id: "cl-5-basico", p_weeks: 8 }),
    ]);

    if (hubError || trendError) {
      setMessage(hubError?.message ?? trendError?.message ?? "No fue posible cargar el progreso.");
      return;
    }

    setHub(hubData as LearningHubData);
    setTrend((trendData ?? []) as LearningTrendPoint[]);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-200">5° básico</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">Mapa de progreso</h1>
            <p className="mt-3 max-w-3xl leading-7 text-slate-400">Una vista completa de dominio, ejes curriculares y evolución de tu práctica.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/hoy" className="rounded-2xl border border-white/10 px-5 py-3 font-black">← Mi centro</Link>
            <Link href="/informe/5-basico" className="rounded-2xl bg-cyan-300 px-5 py-3 font-black text-slate-950">Informe imprimible</Link>
          </div>
        </div>

        {message ? <p className="mt-6 rounded-2xl bg-rose-300/10 p-4 text-rose-100">{message}</p> : null}

        {hub ? (
          <>
            <div className="mt-8 grid gap-5 lg:grid-cols-[auto_1fr]">
              <section className="grid place-items-center rounded-[2.25rem] border border-white/10 bg-white/[0.03] p-7">
                <ProgressRing value={hub.summary.mastery_percent} label="Dominio global" size={158} />
              </section>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Temas", `${hub.summary.mastered_topics}/${hub.summary.total_topics}`, "dominados"],
                  ["Lecciones", String(hub.summary.lessons_completed), "completadas"],
                  ["Prácticas", String(hub.summary.practice_sessions), "sesiones"],
                  ["Diagnóstico", hub.summary.latest_diagnostic_score === null ? "—" : `${hub.summary.latest_diagnostic_score}%`, "último resultado"],
                ].map(([label, value, detail]) => (
                  <article key={label} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-3 text-4xl font-black text-white">{value}</p>
                    <p className="mt-2 text-sm text-slate-500">{detail}</p>
                  </article>
                ))}
              </section>
            </div>

            <section className="mt-8 rounded-[2.25rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-200">Ejes curriculares</p>
              <h2 className="mt-2 text-2xl font-black">Dominio por área</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {hub.axes.map((axis) => (
                  <article key={axis.axis_id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-2xl">{axis.axis_icon}</p>
                        <h3 className="mt-2 font-black">{axis.axis_name}</h3>
                        <p className="mt-1 text-xs text-slate-500">{axis.mastered_topics}/{axis.total_topics} dominados</p>
                      </div>
                      <p className="text-3xl font-black text-white">{axis.mastery_percent}%</p>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
                      <div className={`h-full rounded-full bg-gradient-to-r ${color(axis.mastery_percent)}`} style={{ width: `${axis.mastery_percent}%` }} />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-[2.25rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">8 semanas</p>
              <h2 className="mt-2 text-2xl font-black">Evolución del puntaje de práctica</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">La línea muestra el promedio semanal de tus prácticas completadas.</p>
              <div className="mt-6"><LearningTrendChart points={trend} /></div>
            </section>

            <section className="mt-8 rounded-[2.25rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Prioridades</p>
                  <h2 className="mt-2 text-2xl font-black">Temas que más pueden mejorar</h2>
                </div>
                <Link href="/mi-ruta" className="text-sm font-black text-cyan-200">Abrir Mi ruta →</Link>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {hub.priority_topics.map((topic) => (
                  <article key={topic.topic_id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">{topic.axis_name}</p>
                    <h3 className="mt-2 font-black text-white">{topic.topic_title}</h3>
                    <p className="mt-3 text-3xl font-black text-amber-200">{topic.mastery_percent}%</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{topic.reason}</p>
                    <div className="mt-4 flex gap-2">
                      {topic.lesson_slug ? <Link href={`/aprender/leccion/${topic.lesson_slug}`} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black">Lección</Link> : null}
                      <Link href={`/practica-escolar/${topic.topic_slug}`} className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950">Practicar</Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
