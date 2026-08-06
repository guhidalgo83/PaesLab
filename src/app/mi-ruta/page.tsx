"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import StudyRecommendationCard from "@/components/mathlabs/StudyRecommendationCard";
import { createClient } from "@/lib/supabase/client";
import type {
  Course,
  KnowledgeTopic,
  StudentSchoolProfile,
  StudentTopicMastery,
} from "@/types/school";
import type {
  StudyRecommendation,
  StudyRecommendationStatus,
} from "@/types/diagnostic";

type DiagnosticSession = {
  id: string;
  status: string;
  score_percent: number;
  completed_at: string | null;
  started_at: string;
};

const masteryStatusLabels: Record<StudentTopicMastery["status"], string> = {
  not_started: "No evaluado",
  learning: "En aprendizaje",
  practicing: "En práctica",
  mastered: "Dominado",
  review: "Requiere repaso",
};

export default function MyLearningPathPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<StudentSchoolProfile | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<KnowledgeTopic[]>([]);
  const [mastery, setMastery] = useState<StudentTopicMastery[]>([]);
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([]);
  const [diagnostic, setDiagnostic] = useState<DiagnosticSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const loadPath = useCallback(async () => {
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
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    if (!profileData) {
      router.replace("/configurar-perfil");
      return;
    }

    const loadedProfile = profileData as unknown as StudentSchoolProfile;
    const [courseResult, topicResult, masteryResult, recommendationResult, diagnosticResult] =
      await Promise.all([
        supabase.from("courses").select("*").eq("id", loadedProfile.course_id).maybeSingle(),
        supabase
          .from("knowledge_topics")
          .select("*")
          .eq("course_id", loadedProfile.course_id)
          .eq("is_published", true)
          .order("sort_order"),
        supabase
          .from("student_topic_mastery")
          .select("*")
          .eq("user_id", authData.user.id),
        supabase
          .from("student_study_recommendations")
          .select("*")
          .eq("user_id", authData.user.id)
          .eq("course_id", loadedProfile.course_id)
          .in("status", ["pending", "in_progress"])
          .order("priority", { ascending: false })
          .order("due_date", { ascending: true }),
        supabase
          .from("school_diagnostic_sessions")
          .select("id,status,score_percent,completed_at,started_at")
          .eq("user_id", authData.user.id)
          .eq("course_id", loadedProfile.course_id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    setProfile(loadedProfile);
    setCourse(courseResult.data as unknown as Course | null);
    setTopics((topicResult.data ?? []) as unknown as KnowledgeTopic[]);
    setMastery((masteryResult.data ?? []) as unknown as StudentTopicMastery[]);
    setRecommendations(
      (recommendationResult.data ?? []) as unknown as StudyRecommendation[],
    );
    setDiagnostic(diagnosticResult.data as unknown as DiagnosticSession | null);
    setMessage(
      courseResult.error?.message ??
        topicResult.error?.message ??
        masteryResult.error?.message ??
        recommendationResult.error?.message ??
        diagnosticResult.error?.message ??
        "",
    );
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPath();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPath]);

  async function updateRecommendation(
    id: string,
    status: Exclude<StudyRecommendationStatus, "pending">,
  ) {
    setBusyId(id);
    const { error } = await supabase
      .from("student_study_recommendations")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      setRecommendations((current) =>
        status === "dismissed" || status === "completed"
          ? current.filter((item) => item.id !== id)
          : current.map((item) => (item.id === id ? { ...item, status } : item)),
      );
    }
    setBusyId("");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        Construyendo tu ruta...
      </main>
    );
  }

  const assessed = mastery.filter((item) => item.attempts_count > 0);
  const overall = assessed.length
    ? Math.round(
        assessed.reduce((sum, item) => sum + item.mastery_percent, 0) /
          assessed.length,
      )
    : 0;
  const rankedTopics = [...topics].sort((a, b) => {
    const aValue = mastery.find((item) => item.topic_id === a.id)?.mastery_percent ?? 0;
    const bValue = mastery.find((item) => item.topic_id === b.id)?.mastery_percent ?? 0;
    return aValue - bValue || a.sort_order - b.sort_order;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-black text-teal-300">Ruta personalizada</p>
            <h1 className="mt-2 text-4xl font-black sm:text-6xl">Mi ruta MathLabs</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
              {course?.name ?? profile?.course_id}: prioridades combinadas con tu
              diagnóstico, tu progreso y los contenidos que necesitas revisar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/diagnostico-escolar"
              className="rounded-xl bg-indigo-300 px-5 py-3 font-black text-slate-950"
            >
              {diagnostic ? "Repetir diagnóstico" : "Realizar diagnóstico"}
            </Link>
            <Link
              href="/agenda-estudio"
              className="rounded-xl border border-white/15 px-5 py-3 font-black"
            >
              Agregar evaluación
            </Link>
          </div>
        </div>

        {message && (
          <p className="mt-6 rounded-xl bg-rose-300/10 p-4 text-rose-200">{message}</p>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm font-black text-teal-300">Dominio estimado</p>
            <p className="mt-3 text-5xl font-black">{overall}%</p>
            <p className="mt-2 text-sm text-slate-400">
              Calculado sobre {assessed.length} temas con evidencia.
            </p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm font-black text-amber-300">Prioridades abiertas</p>
            <p className="mt-3 text-5xl font-black">{recommendations.length}</p>
            <p className="mt-2 text-sm text-slate-400">
              Ordenadas por urgencia y fecha sugerida.
            </p>
          </article>
          <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm font-black text-indigo-300">Último diagnóstico</p>
            <p className="mt-3 text-5xl font-black">
              {diagnostic ? `${diagnostic.score_percent}%` : "—"}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {diagnostic ? "Resultado inicial registrado." : "Aún no realizado."}
            </p>
          </article>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-black text-amber-300">Plan de acción</p>
                <h2 className="mt-2 text-3xl font-black">Qué revisar primero</h2>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {recommendations.map((recommendation) => (
                <StudyRecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  topic={topics.find((topic) => topic.id === recommendation.topic_id) ?? null}
                  busy={busyId === recommendation.id}
                  onStatusChange={(id, status) =>
                    void updateRecommendation(id, status)
                  }
                />
              ))}
              {recommendations.length === 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
                  <h3 className="text-xl font-black">Aún no hay prioridades activas</h3>
                  <p className="mt-3 leading-7 text-slate-400">
                    Realiza el diagnóstico o agrega una próxima evaluación para que
                    MathLabs organice tu ruta.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
            <p className="font-black text-indigo-200">Mapa de temas</p>
            <h2 className="mt-2 text-3xl font-black">Estado actual</h2>
            <div className="mt-6 space-y-3">
              {rankedTopics.slice(0, 12).map((topic) => {
                const item = mastery.find((entry) => entry.topic_id === topic.id);
                const value = item?.mastery_percent ?? 0;
                const status = item?.status ?? "not_started";
                return (
                  <Link
                    key={topic.id}
                    href={`/matematica/tema/${topic.slug}`}
                    className="block rounded-2xl border border-white/10 bg-slate-950/40 p-4 hover:border-indigo-300/35"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black">{topic.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {masteryStatusLabels[status]}
                        </p>
                      </div>
                      <strong className="text-teal-200">{value}%</strong>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-teal-300"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link
              href={`/matematica/${course?.slug ?? "5-basico"}`}
              className="mt-6 inline-block text-sm font-black text-indigo-200"
            >
              Ver mapa curricular completo →
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}
