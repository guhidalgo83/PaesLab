"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import MasteryMap from "@/components/mathlabs/MasteryMap";
import NextActions from "@/components/mathlabs/NextActions";
import ProgressRing from "@/components/mathlabs/ProgressRing";
import { createClient } from "@/lib/supabase/client";
import type { LearningHubData } from "@/types/learning-os";

export default function TodayPage() {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<LearningHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setMessage("Inicia sesión para construir tu centro personalizado.");
      setLoading(false);
      return;
    }

    await supabase.rpc("refresh_my_achievements");

    const { data: result, error } = await supabase.rpc("get_my_learning_hub", {
      p_course_id: "cl-5-basico",
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setData(result as LearningHubData);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function updatePreference(field: "weekly_goal" | "preferred_session_minutes" | "focus_mode", value: number | string) {
    if (!data) return;
    const next = {
      weekly_goal: data.preferences.weekly_goal,
      preferred_session_minutes: data.preferences.preferred_session_minutes,
      focus_mode: data.preferences.focus_mode,
      [field]: value,
    };

    const { error } = await supabase.rpc("set_my_learning_preferences", {
      p_weekly_goal: next.weekly_goal,
      p_preferred_session_minutes: next.preferred_session_minutes,
      p_focus_mode: next.focus_mode,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setData({ ...data, preferences: next as LearningHubData["preferences"] });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <div className="overflow-hidden rounded-[2.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.20),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.14),transparent_28%),linear-gradient(135deg,#0f172a,#020617)] p-7 sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-200">Mi centro MathLabs</p>
          <div className="mt-4 grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black leading-tight sm:text-6xl">Tu matemática, organizada para hoy.</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                Diagnóstico, progreso, errores, laboratorios y práctica se combinan para recomendarte el siguiente paso.
              </p>
            </div>
            {data ? (
              <div className="grid grid-cols-2 gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
                <ProgressRing value={data.summary.mastery_percent} label="Dominio global" size={112} />
                <div className="flex flex-col justify-center">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Esta semana</p>
                  <p className="mt-2 text-4xl font-black text-white">{data.summary.activities_this_week}</p>
                  <p className="mt-1 text-sm text-slate-400">actividades completadas</p>
                  <p className="mt-3 text-xs font-black text-cyan-200">Meta: {data.preferences.weekly_goal}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {loading ? <p className="mt-8 text-slate-400">Construyendo tu ruta...</p> : null}
        {message ? <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm font-bold text-amber-100">{message}</div> : null}

        {data ? (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["🧠", "Temas dominados", `${data.summary.mastered_topics}/${data.summary.total_topics}`],
                ["✏️", "Preguntas respondidas", String(data.summary.questions_answered)],
                ["🧪", "Laboratorios", `${data.summary.labs_completed}/${data.summary.labs_total}`],
                ["🎯", "Precisión práctica", `${data.summary.practice_accuracy}%`],
              ].map(([emoji, label, value]) => (
                <article key={label} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-3xl">{emoji}</p>
                  <p className="mt-4 text-3xl font-black text-white">{value}</p>
                  <p className="mt-1 text-sm text-slate-500">{label}</p>
                </article>
              ))}
            </div>

            <div className="mt-8">
              <NextActions actions={data.next_actions} />
            </div>

            <div className="mt-8">
              <MasteryMap axes={data.axes} topics={data.priority_topics} />
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-[2.25rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-200">Actividad reciente</p>
                    <h2 className="mt-2 text-2xl font-black">Lo último que hiciste</h2>
                  </div>
                  <Link href="/progreso/5-basico" className="text-sm font-black text-cyan-200">Ver progreso →</Link>
                </div>
                <div className="mt-5 space-y-3">
                  {data.recent_activity.length === 0 ? (
                    <p className="rounded-2xl bg-slate-950/35 p-4 text-sm text-slate-500">Todavía no hay actividad registrada.</p>
                  ) : data.recent_activity.map((item, index) => (
                    <article key={`${item.kind}-${item.happened_at}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-slate-950/35 p-4">
                      <div>
                        <p className="font-black text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{new Date(item.happened_at).toLocaleDateString("es-CL")}</p>
                      </div>
                      {item.score !== null ? <span className="rounded-xl bg-cyan-300/10 px-3 py-1 font-black text-cyan-200">{item.score}%</span> : null}
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-[2.25rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Preferencias</p>
                <h2 className="mt-2 text-2xl font-black">Cómo quieres aprender</h2>

                <label className="mt-6 block">
                  <span className="text-sm font-black text-slate-300">Sesión ideal</span>
                  <select
                    value={data.preferences.preferred_session_minutes}
                    onChange={(event) => void updatePreference("preferred_session_minutes", Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 font-bold text-white"
                  >
                    <option value={10}>10 minutos</option>
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                  </select>
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-black text-slate-300">Enfoque</span>
                  <select
                    value={data.preferences.focus_mode}
                    onChange={(event) => void updatePreference("focus_mode", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 font-bold text-white"
                  >
                    <option value="balanced">Equilibrado</option>
                    <option value="reinforcement">Reforzar brechas</option>
                    <option value="challenge">Buscar desafíos</option>
                  </select>
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-black text-slate-300">Meta semanal</span>
                  <select
                    value={data.preferences.weekly_goal}
                    onChange={(event) => void updatePreference("weekly_goal", Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 font-bold text-white"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((value) => <option key={value} value={value}>{value} actividades</option>)}
                  </select>
                </label>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Link href="/mis-errores" className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-black text-white">Cuaderno de errores</Link>
                  <Link href="/logros" className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-black text-white">Mis logros</Link>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
