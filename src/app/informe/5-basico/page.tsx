"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import LearningTrendChart from "@/components/mathlabs/LearningTrendChart";
import { createClient } from "@/lib/supabase/client";
import type { LearningHubData, LearningTrendPoint } from "@/types/learning-os";

export default function FifthGradeReportPage() {
  const supabase = useMemo(() => createClient(), []);
  const [hub, setHub] = useState<LearningHubData | null>(null);
  const [trend, setTrend] = useState<LearningTrendPoint[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string>("");

  const load = useCallback(async () => {
    const [{ data: hubData }, { data: trendData }] = await Promise.all([
      supabase.rpc("get_my_learning_hub", { p_course_id: "cl-5-basico" }),
      supabase.rpc("get_my_learning_trend", { p_course_id: "cl-5-basico", p_weeks: 8 }),
    ]);
    setHub(hubData as LearningHubData);
    setTrend((trendData ?? []) as LearningTrendPoint[]);
    setGeneratedAt(new Date().toLocaleString("es-CL"));
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <main className="min-h-screen bg-slate-950 text-white print:bg-white print:text-slate-950">
      <div className="print:hidden"><MathLabsHeader /></div>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:py-14 print:max-w-none print:px-0 print:py-0">
        <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-6 print:border-slate-300">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200 print:text-slate-600">MathLabs</p>
            <h1 className="mt-2 text-4xl font-black">Informe de aprendizaje · 5° básico</h1>
            <p className="mt-2 text-sm text-slate-500">Generado: {generatedAt || "..."}</p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-2xl bg-cyan-300 px-5 py-3 font-black text-slate-950 print:hidden"
          >
            Imprimir / guardar PDF
          </button>
        </div>

        {hub ? (
          <>
            <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
              {[
                ["Dominio global", `${hub.summary.mastery_percent}%`],
                ["Temas dominados", `${hub.summary.mastered_topics}/${hub.summary.total_topics}`],
                ["Precisión práctica", `${hub.summary.practice_accuracy}%`],
                ["Laboratorios", `${hub.summary.labs_completed}/${hub.summary.labs_total}`],
              ].map(([label, value]) => (
                <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 print:border-slate-300 print:bg-white">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-3 text-3xl font-black">{value}</p>
                </article>
              ))}
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-black">Dominio por eje</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 print:grid-cols-2">
                {hub.axes.map((axis) => (
                  <article key={axis.axis_id} className="rounded-2xl border border-white/10 p-4 print:border-slate-300">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-black">{axis.axis_icon} {axis.axis_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{axis.mastered_topics}/{axis.total_topics} temas dominados</p>
                      </div>
                      <p className="text-2xl font-black">{axis.mastery_percent}%</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-800 print:bg-slate-200">
                      <div className="h-full rounded-full bg-cyan-400 print:bg-slate-700" style={{ width: `${axis.mastery_percent}%` }} />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-8 break-inside-avoid">
              <h2 className="text-2xl font-black">Evolución reciente</h2>
              <div className="mt-4 print:hidden"><LearningTrendChart points={trend} /></div>
              <div className="mt-4 hidden print:block">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      {["Semana", "Prácticas", "Promedio", "Preguntas", "Lecciones", "Labs"].map((heading) => <th key={heading} className="border border-slate-300 p-2 text-left">{heading}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {trend.map((point) => (
                      <tr key={point.week_start}>
                        <td className="border border-slate-300 p-2">{new Date(point.week_start).toLocaleDateString("es-CL")}</td>
                        <td className="border border-slate-300 p-2">{point.practice_sessions}</td>
                        <td className="border border-slate-300 p-2">{point.average_score}%</td>
                        <td className="border border-slate-300 p-2">{point.questions_answered}</td>
                        <td className="border border-slate-300 p-2">{point.lessons_completed}</td>
                        <td className="border border-slate-300 p-2">{point.labs_completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-black">Prioridades recomendadas</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 print:grid-cols-2">
                {hub.priority_topics.slice(0, 6).map((topic) => (
                  <article key={topic.topic_id} className="rounded-2xl border border-white/10 p-4 print:border-slate-300">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">{topic.axis_name}</p>
                    <p className="mt-2 font-black">{topic.topic_title}</p>
                    <p className="mt-1 text-sm text-slate-500">Dominio estimado: {topic.mastery_percent}%</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400 print:text-slate-600">{topic.reason}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-white/10 p-5 print:border-slate-300">
              <h2 className="text-xl font-black">Lectura general</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400 print:text-slate-700">
                Este informe resume evidencia registrada dentro de MathLabs. El porcentaje de dominio es una estimación pedagógica construida a partir de diagnósticos y prácticas realizadas en la plataforma; no reemplaza la evaluación del establecimiento ni del docente.
              </p>
            </section>
          </>
        ) : <p className="mt-8 text-slate-500">Generando informe...</p>}
      </section>
    </main>
  );
}
