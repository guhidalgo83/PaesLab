"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import { createClient } from "@/lib/supabase/client";
import type {
  Course,
  CurriculumAxis,
  CurriculumObjective,
  KnowledgeTopic,
  StudentTopicMastery,
} from "@/types/school";

type LinkedLesson = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  estimated_minutes: number;
};

export default function TopicPage() {
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);
  const [topic, setTopic] = useState<KnowledgeTopic | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [axis, setAxis] = useState<CurriculumAxis | null>(null);
  const [objectives, setObjectives] = useState<CurriculumObjective[]>([]);
  const [prerequisites, setPrerequisites] = useState<KnowledgeTopic[]>([]);
  const [lessons, setLessons] = useState<LinkedLesson[]>([]);
  const [mastery, setMastery] = useState<StudentTopicMastery | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function initialize() {
    const slug = String(params.topicSlug ?? "");
    const { data: topicData, error: topicError } = await supabase
      .from("knowledge_topics")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (topicError || !topicData) {
      setMessage(topicError?.message ?? "Tema no encontrado.");
      setLoading(false);
      return;
    }

    const loadedTopic = topicData as unknown as KnowledgeTopic;
    setTopic(loadedTopic);

    const [courseResult, axisResult, objectiveLinksResult, prerequisiteLinksResult, lessonLinksResult, authResult] = await Promise.all([
      supabase.from("courses").select("*").eq("id", loadedTopic.course_id).maybeSingle(),
      supabase.from("curriculum_axes").select("*").eq("id", loadedTopic.axis_id).maybeSingle(),
      supabase.from("curriculum_objective_topics").select("objective_id").eq("topic_id", loadedTopic.id),
      supabase.from("topic_prerequisites").select("prerequisite_topic_id").eq("topic_id", loadedTopic.id),
      supabase.from("lesson_curriculum_links").select("lesson_id").eq("topic_id", loadedTopic.id),
      supabase.auth.getUser(),
    ]);

    setCourse(courseResult.data as unknown as Course | null);
    setAxis(axisResult.data as unknown as CurriculumAxis | null);

    const objectiveIds = (objectiveLinksResult.data ?? []).map((item) => item.objective_id);
    if (objectiveIds.length > 0) {
      const { data } = await supabase.from("curriculum_objectives").select("*").in("id", objectiveIds).order("sort_order");
      setObjectives((data ?? []) as unknown as CurriculumObjective[]);
    }

    const prerequisiteIds = (prerequisiteLinksResult.data ?? []).map((item) => item.prerequisite_topic_id);
    if (prerequisiteIds.length > 0) {
      const { data } = await supabase.from("knowledge_topics").select("*").in("id", prerequisiteIds).order("sort_order");
      setPrerequisites((data ?? []) as unknown as KnowledgeTopic[]);
    }

    const lessonIds = (lessonLinksResult.data ?? []).map((item) => item.lesson_id);
    if (lessonIds.length > 0) {
      const { data } = await supabase
        .from("lessons")
        .select("id,slug,title,summary,estimated_minutes")
        .in("id", lessonIds)
        .eq("is_published", true);
      setLessons((data ?? []) as unknown as LinkedLesson[]);
    }

    if (authResult.data.user) {
      const { data } = await supabase
        .from("student_topic_mastery")
        .select("*")
        .eq("user_id", authResult.data.user.id)
        .eq("topic_id", loadedTopic.id)
        .maybeSingle();
      setMastery(data as unknown as StudentTopicMastery | null);
    }

    const firstError = courseResult.error ?? axisResult.error ?? objectiveLinksResult.error ?? prerequisiteLinksResult.error ?? lessonLinksResult.error;
    if (firstError) setMessage(firstError.message);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initialize();
  }, [params]);

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 text-white">Cargando tema...</main>;
  }

  if (!topic) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
        <section className="text-center">
          <h1 className="text-3xl font-black">Tema no encontrado</h1>
          <p className="mt-3 text-slate-400">{message}</p>
          <Link href="/matematica" className="mt-6 inline-block rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950">Volver a cursos</Link>
        </section>
      </main>
    );
  }

  const masteryValue = mastery?.mastery_percent ?? 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <p className="font-black text-teal-300">{course?.name ?? "Matemática"} · {axis?.name ?? "Tema"}</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">{topic.title}</h1>
        <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-400">{topic.summary}</p>

        {message && <p className="mt-6 rounded-xl bg-rose-300/10 p-4 text-rose-200">{message}</p>}

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.38fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <p className="font-black text-indigo-300">Objetivos relacionados</p>
              <div className="mt-5 space-y-4">
                {objectives.map((objective) => (
                  <article key={objective.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                    <p className="text-sm font-black text-teal-300">{objective.code}</p>
                    <h2 className="mt-2 text-xl font-black">{objective.title}</h2>
                    <p className="mt-3 leading-7 text-slate-400">{objective.summary}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <p className="font-black text-amber-300">Materiales MathLabs</p>
              <h2 className="mt-2 text-2xl font-black">Aprende y practica este tema</h2>
              <div className="mt-6 space-y-4">
                {lessons.map((lesson) => (
                  <article key={lesson.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black">{lesson.title}</h3>
                        <p className="mt-2 leading-7 text-slate-400">{lesson.summary}</p>
                      </div>
                      <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">{lesson.estimated_minutes} min</span>
                    </div>
                    <Link href={`/aprender/leccion/${lesson.slug}`} className="mt-4 inline-block rounded-xl bg-teal-300 px-4 py-3 text-sm font-black text-slate-950">
                      Abrir lección
                    </Link>
                  </article>
                ))}
                {lessons.length === 0 && (
                  <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-5">
                    <p className="font-black text-amber-200">Contenido profundo en preparación</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      El tema ya está incorporado al mapa curricular. Las lecciones y ejercicios específicos se irán publicando progresivamente.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link href="/aprender" className="rounded-xl border border-white/15 px-4 py-3 text-sm font-black">Explorar lecciones</Link>
                      <Link href="/entrenar" className="rounded-xl border border-white/15 px-4 py-3 text-sm font-black">Practicar</Link>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <p className="text-sm font-black text-teal-300">Tu dominio</p>
              <p className="mt-2 text-4xl font-black">{masteryValue}%</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-teal-300 to-indigo-400" style={{ width: `${masteryValue}%` }} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                El porcentaje aumentará con diagnóstico, lecciones y práctica vinculada.
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <p className="font-black text-sky-300">Conocimientos previos</p>
              <div className="mt-4 space-y-3">
                {prerequisites.map((item) => (
                  <Link key={item.id} href={`/matematica/tema/${item.slug}`} className="block rounded-xl border border-white/10 bg-slate-950/40 p-4 text-sm font-bold">
                    {item.title} →
                  </Link>
                ))}
                {prerequisites.length === 0 && <p className="text-sm text-slate-400">No hay prerrequisitos registrados para este tema.</p>}
              </div>
            </section>

            <Link href="/agenda-estudio" className="block rounded-3xl bg-amber-300 p-6 font-black text-slate-950">
              Agregar este tema a una prueba o guía →
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
