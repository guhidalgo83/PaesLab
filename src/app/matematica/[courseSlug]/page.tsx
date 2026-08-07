"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import MathLabsGuide from "@/components/mathlabs/MathLabsGuide";
import CurriculumObjectiveCard from "@/components/mathlabs/CurriculumObjectiveCard";
import { createClient } from "@/lib/supabase/client";
import type {
  Course,
  CurriculumAxis,
  CurriculumObjective,
  KnowledgeTopic,
  StudentTopicMastery,
} from "@/types/school";

export default function CoursePage() {
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);
  const courseSlug = String(params.courseSlug ?? "");
  const [course, setCourse] = useState<Course | null>(null);
  const [axes, setAxes] = useState<CurriculumAxis[]>([]);
  const [objectives, setObjectives] = useState<CurriculumObjective[]>([]);
  const [topics, setTopics] = useState<KnowledgeTopic[]>([]);
  const [mastery, setMastery] = useState<StudentTopicMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadCourse = useCallback(async () => {
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("slug", courseSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (courseError || !courseData) {
      setErrorMessage(courseError?.message ?? "Curso no encontrado.");
      setLoading(false);
      return;
    }

    const loadedCourse = courseData as unknown as Course;
    setCourse(loadedCourse);

    const [
      { data: axisData },
      { data: objectiveData },
      { data: topicData },
      authResult,
    ] = await Promise.all([
      supabase
        .from("curriculum_axes")
        .select("*")
        .eq("course_id", loadedCourse.id)
        .eq("is_published", true)
        .order("sort_order"),
      supabase
        .from("curriculum_objectives")
        .select("*")
        .eq("course_id", loadedCourse.id)
        .eq("is_published", true)
        .order("sort_order"),
      supabase
        .from("knowledge_topics")
        .select("*")
        .eq("course_id", loadedCourse.id)
        .eq("is_published", true)
        .order("sort_order"),
      supabase.auth.getUser(),
    ]);

    const loadedAxes = (axisData ?? []) as unknown as CurriculumAxis[];
    const loadedObjectives = (objectiveData ?? []) as unknown as CurriculumObjective[];
    const loadedTopics = (topicData ?? []) as unknown as KnowledgeTopic[];
    setAxes(loadedAxes);
    setObjectives(loadedObjectives);
    setTopics(loadedTopics);

    const user = authResult.data.user;
    if (user && loadedTopics.length > 0) {
      const { data: masteryData } = await supabase
        .from("student_topic_mastery")
        .select("*")
        .eq("user_id", user.id)
        .in(
          "topic_id",
          loadedTopics.map((topic) => topic.id),
        );
      setMastery((masteryData ?? []) as unknown as StudentTopicMastery[]);
    }

    setLoading(false);
  }, [courseSlug, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCourse();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCourse]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        Cargando curso...
      </main>
    );
  }

  if (!course) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
        <section className="text-center">
          <h1 className="text-3xl font-black">Curso no encontrado</h1>
          <p className="mt-3 text-slate-400">{errorMessage}</p>
          <Link
            href="/matematica"
            className="mt-6 inline-block rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950"
          >
            Volver a cursos
          </Link>
        </section>
      </main>
    );
  }

  const overall = topics.length
    ? Math.round(
        topics.reduce(
          (sum, topic) =>
            sum +
            (mastery.find((item) => item.topic_id === topic.id)
              ?.mastery_percent ?? 0),
          0,
        ) / topics.length,
      )
    : 0;

  const isFifthGrade = course.slug === "5-basico";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-black text-teal-300">Matemática escolar · Chile</p>
            <h1 className="mt-3 text-5xl font-black sm:text-6xl">{course.name}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
              {course.description}
            </p>
          </div>
          <div className="min-w-64 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-end justify-between">
              <span className="text-sm text-slate-400">Progreso curricular</span>
              <strong className="text-3xl text-teal-300">{overall}%</strong>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-300 to-indigo-400"
                style={{ width: `${overall}%` }}
              />
            </div>
            <Link
              href="/configurar-perfil"
              className="mt-5 inline-block text-sm font-black text-indigo-200"
            >
              Usar como mi curso →
            </Link>
          </div>
        </div>

        {isFifthGrade ? (
          <section className="mt-10 overflow-hidden rounded-[2.5rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.14),transparent_28%),linear-gradient(135deg,#0f172a,#020617)] p-7 sm:p-9">
            <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
                  Nueva experiencia visual
                </p>
                <h2 className="mt-3 text-3xl font-black sm:text-5xl">
                  Recorre el Tomo 1 como una aventura
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-slate-300">
                  Nueve capítulos, modelos visuales, práctica guiada y dos grandes
                  desafíos de unidad. El mapa marca tu progreso y recomienda el
                  siguiente paso.
                </p>
                <Link
                  href="/aventura/5-basico"
                  className="mt-6 inline-block rounded-2xl bg-cyan-300 px-6 py-4 font-black text-slate-950"
                >
                  Abrir Aventura Matemática →
                </Link>
              </div>
              <MathLabsGuide
                compact
                message="El mapa del Tomo 1 no reemplaza el curso completo: te ayuda a recorrer sus contenidos en un orden más entretenido y fácil de seguir."
              />
            </div>
          </section>
        ) : null}

        {!course.is_available ? (
          <p className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5 text-amber-200">
            El mapa de este curso está planificado, pero sus contenidos todavía no están publicados.
          </p>
        ) : null}

        <div className="mt-12 space-y-10">
          {axes.map((axis) => {
            const axisObjectives = objectives.filter(
              (objective) => objective.axis_id === axis.id,
            );
            const axisTopics = topics.filter((topic) => topic.axis_id === axis.id);
            const axisMastery = axisTopics.length
              ? Math.round(
                  axisTopics.reduce(
                    (sum, topic) =>
                      sum +
                      (mastery.find((item) => item.topic_id === topic.id)
                        ?.mastery_percent ?? 0),
                    0,
                  ) / axisTopics.length,
                )
              : 0;

            return (
              <section
                key={axis.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-indigo-300/10 font-black text-indigo-200">
                      {axis.icon}
                    </span>
                    <div>
                      <h2 className="text-3xl font-black">{axis.name}</h2>
                      <p className="mt-2 max-w-3xl leading-7 text-slate-400">
                        {axis.description}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-teal-200">
                    {axisMastery}% dominado
                  </span>
                </div>

                <div className="mt-7 grid gap-4 lg:grid-cols-2">
                  {axisObjectives.map((objective) => {
                    const topic =
                      axisTopics.find(
                        (item) => item.id === `topic-${objective.id}`,
                      ) ??
                      axisTopics.find(
                        (item) => item.sort_order === objective.sort_order,
                      );
                    const value = topic
                      ? mastery.find((item) => item.topic_id === topic.id)
                          ?.mastery_percent ?? 0
                      : 0;
                    return (
                      <CurriculumObjectiveCard
                        key={objective.id}
                        objective={objective}
                        topic={topic}
                        mastery={value}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {course.curriculum_source_url ? (
          <p className="mt-10 text-sm leading-6 text-slate-500">
            Referencia curricular: Currículum Nacional de Chile. MathLabs organiza y
            resume los objetivos para su navegación pedagógica.
          </p>
        ) : null}
      </section>
    </main>
  );
}
