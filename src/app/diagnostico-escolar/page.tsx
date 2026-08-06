"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import { createClient } from "@/lib/supabase/client";
import type { Course, StudentSchoolProfile } from "@/types/school";
import type { DiagnosticStartResult } from "@/types/diagnostic";

type SessionSummary = {
  id: string;
  status: "started" | "completed" | "abandoned";
  total_questions: number;
  answered_questions: number;
  score_percent: number;
  started_at: string;
  completed_at: string | null;
};

export default function SchoolDiagnosticPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<StudentSchoolProfile | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.replace("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("student_school_profiles")
        .select("*")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (profileError) {
        if (!cancelled) {
          setMessage(profileError.message);
          setLoading(false);
        }
        return;
      }

      if (!profileData) {
        router.replace("/configurar-perfil");
        return;
      }

      const loadedProfile = profileData as unknown as StudentSchoolProfile;
      const [courseResult, sessionResult] = await Promise.all([
        supabase.from("courses").select("*").eq("id", loadedProfile.course_id).maybeSingle(),
        supabase
          .from("school_diagnostic_sessions")
          .select("id,status,total_questions,answered_questions,score_percent,started_at,completed_at")
          .eq("user_id", authData.user.id)
          .eq("course_id", loadedProfile.course_id)
          .order("started_at", { ascending: false })
          .limit(5),
      ]);

      if (!cancelled) {
        setProfile(loadedProfile);
        setCourse(courseResult.data as unknown as Course | null);
        setSessions((sessionResult.data ?? []) as unknown as SessionSummary[]);
        setMessage(courseResult.error?.message ?? sessionResult.error?.message ?? "");
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function startDiagnostic() {
    if (!profile) return;
    setStarting(true);
    setMessage("");

    const { data, error } = await supabase.rpc("start_school_diagnostic", {
      p_course_id: profile.course_id,
    });

    if (error || !data) {
      setMessage(error?.message ?? "No pudimos iniciar el diagnóstico.");
      setStarting(false);
      return;
    }

    const result = data as unknown as DiagnosticStartResult;
    router.push(`/diagnostico-escolar/${result.session_id}`);
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        Preparando diagnóstico...
      </main>
    );
  }

  const activeSession = sessions.find((session) => session.status === "started");
  const latestCompleted = sessions.find((session) => session.status === "completed");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <section>
            <p className="font-black text-teal-300">Diagnóstico inicial</p>
            <h1 className="mt-3 text-4xl font-black sm:text-6xl">
              Descubre qué sabes y por dónde conviene comenzar.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
              El diagnóstico de {course?.name ?? "tu curso"} revisa habilidades de
              números, álgebra, geometría, medición y datos. No tiene nota ni límite de
              tiempo: su objetivo es construir una ruta personal.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["24", "preguntas breves"],
                ["12", "temas evaluados"],
                ["1", "ruta personalizada"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <strong className="text-3xl text-indigo-200">{value}</strong>
                  <p className="mt-2 text-sm text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            {message && (
              <p className="mt-6 rounded-xl bg-rose-300/10 p-4 text-rose-200">
                {message}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {activeSession ? (
                <Link
                  href={`/diagnostico-escolar/${activeSession.id}`}
                  className="rounded-xl bg-teal-300 px-6 py-4 font-black text-slate-950"
                >
                  Continuar diagnóstico ({activeSession.answered_questions}/{activeSession.total_questions})
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={starting}
                  onClick={() => void startDiagnostic()}
                  className="rounded-xl bg-teal-300 px-6 py-4 font-black text-slate-950 disabled:opacity-50"
                >
                  {starting
                    ? "Creando diagnóstico..."
                    : latestCompleted
                      ? "Realizar un nuevo diagnóstico"
                      : "Comenzar diagnóstico"}
                </button>
              )}
              <Link
                href="/mi-ruta"
                className="rounded-xl border border-white/15 px-6 py-4 font-black"
              >
                Ver mi ruta actual
              </Link>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-300/10 via-teal-300/5 to-transparent p-7">
            <p className="font-black text-indigo-200">Cómo funciona</p>
            <div className="mt-6 space-y-4">
              {[
                "Responde sin buscar la solución externa.",
                "Indica qué tan seguro/a estás de cada respuesta.",
                "Revisa la explicación después de responder.",
                "Al finalizar recibirás prioridades y fortalezas.",
              ].map((step, index) => (
                <div key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white/10 font-black text-teal-200">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-300">{step}</p>
                </div>
              ))}
            </div>

            {latestCompleted && (
              <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.05] p-5">
                <p className="text-sm font-black text-emerald-200">Último resultado</p>
                <p className="mt-2 text-4xl font-black">{latestCompleted.score_percent}%</p>
                <Link
                  href={`/diagnostico-escolar/${latestCompleted.id}/resultado`}
                  className="mt-4 inline-block text-sm font-black text-emerald-200"
                >
                  Revisar informe →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
