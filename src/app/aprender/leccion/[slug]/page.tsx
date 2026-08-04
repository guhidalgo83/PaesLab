"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LearningHeader from "@/components/learning/LearningHeader";
import LessonBlockRenderer from "@/components/learning/LessonBlockRenderer";
import LessonMiniQuiz from "@/components/learning/LessonMiniQuiz";
import LessonProgressTracker from "@/components/learning/LessonProgressTracker";
import type {
  LearningQuestion,
  LearningUnit,
  Lesson,
  LessonBlock,
} from "@/types/learning";

type NavigationLesson = {
  id: string;
  slug: string;
  title: string;
  sort_order: number;
};

export default function LessonPage() {
  const params = useParams();
  const supabase = useMemo(() => createClient(), []);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [unit, setUnit] = useState<LearningUnit | null>(null);
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [questions, setQuestions] = useState<LearningQuestion[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [initialProgress, setInitialProgress] = useState(0);
  const [previousLesson, setPreviousLesson] =
    useState<NavigationLesson | null>(null);
  const [nextLesson, setNextLesson] =
    useState<NavigationLesson | null>(null);
  const [loading, setLoading] = useState(true);

  

  async function load() {
    setLoading(true);
    const slug = String(params.slug ?? "");

    const { data: lessonData } = await supabase
      .from("lessons")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (!lessonData) {
      setLoading(false);
      return;
    }

    const currentLesson = lessonData as Lesson;
    setLesson(currentLesson);

    const [
      { data: unitData },
      { data: blockData },
      { data: siblingData },
      {
        data: { user },
      },
    ] = await Promise.all([
      supabase
        .from("learning_units")
        .select("*")
        .eq("id", currentLesson.unit_id)
        .single(),
      supabase
        .from("lesson_blocks")
        .select("*")
        .eq("lesson_id", currentLesson.id)
        .order("sort_order"),
      supabase
        .from("lessons")
        .select("id,slug,title,sort_order")
        .eq("unit_id", currentLesson.unit_id)
        .eq("is_published", true)
        .order("sort_order"),
      supabase.auth.getUser(),
    ]);

    const currentUnit = unitData as LearningUnit;
    setUnit(currentUnit);
    setBlocks((blockData ?? []) as LessonBlock[]);
    setUserId(user?.id ?? null);

    const siblings = (siblingData ?? []) as NavigationLesson[];
    const currentIndex = siblings.findIndex(
      (item) => item.id === currentLesson.id,
    );

    setPreviousLesson(
      currentIndex > 0 ? siblings[currentIndex - 1] : null,
    );
    setNextLesson(
      currentIndex >= 0 && currentIndex < siblings.length - 1
        ? siblings[currentIndex + 1]
        : null,
    );

    if (user) {
      const { data: progressData } = await supabase
        .from("lesson_progress")
        .select("status,progress_percent")
        .eq("user_id", user.id)
        .eq("lesson_id", currentLesson.id)
        .maybeSingle();

      const isCompleted = progressData?.status === "completed";
      setCompleted(isCompleted);
      setInitialProgress(
        isCompleted ? 100 : progressData?.progress_percent ?? 0,
      );

      if (!progressData) {
        await supabase.from("lesson_progress").insert({
          user_id: user.id,
          lesson_id: currentLesson.id,
          status: "in_progress",
          progress_percent: 10,
          last_block_order: 1,
          started_at: new Date().toISOString(),
        });
        setInitialProgress(10);
      }
    }

    const { data: links } = await supabase
      .from("lesson_question_links")
      .select(
        "sort_order,questions(id,prompt,options,correct_index,explanation,visual_type,visual_data,image_url,image_alt)",
      )
      .eq("lesson_id", currentLesson.id)
      .eq("purpose", "mini_quiz")
      .order("sort_order")
      .limit(3);

    let linked = (links ?? [])
      .map((row: { questions: LearningQuestion | LearningQuestion[] | null }) =>
        Array.isArray(row.questions)
          ? row.questions[0]
          : row.questions,
      )
      .filter(Boolean) as LearningQuestion[];

    if (linked.length < 3 && currentUnit) {
      const { data: fallback } = await supabase
        .from("questions")
        .select(
          "id,prompt,options,correct_index,explanation,visual_type,visual_data,image_url,image_alt",
        )
        .eq("is_active", true)
        .eq("test_type", currentUnit.test_type)
        .eq("axis", currentUnit.axis)
        .limit(20);

      linked = [
        ...linked,
        ...((fallback ?? []) as LearningQuestion[]).filter(
          (question) =>
            !linked.some((item) => item.id === question.id),
        ),
      ].slice(0, 3);
    }

    setQuestions(linked);
    setLoading(false);
  }

useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [params]);


  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        Cargando lección...
      </main>
    );
  }

  if (!lesson || !unit) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <h1 className="text-3xl font-black">
          Lección no encontrada
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <LearningHeader
          title={lesson.title}
          subtitle={`${unit.axis} · ${lesson.estimated_minutes} min`}
        />

        <LessonProgressTracker
          userId={userId}
          lessonId={lesson.id}
          initialProgress={initialProgress}
          completed={completed}
        />

        <article className="py-10">
          <Link
            href={`/aprender/${unit.test_type.toLowerCase()}/${unit.slug}`}
            className="text-sm font-bold text-slate-400 hover:text-teal-300"
          >
            ← Volver a {unit.title}
          </Link>

          <div className="mt-6">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-indigo-300/10 px-3 py-1 text-sm font-bold text-indigo-200">
                {lesson.difficulty}
              </span>
              {completed && (
                <span className="rounded-lg bg-emerald-300/10 px-3 py-1 text-sm font-bold text-emerald-200">
                  Completada
                </span>
              )}
            </div>

            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              {lesson.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-400">
              {lesson.summary}
            </p>
          </div>

          <div className="mt-10 space-y-10">
            {blocks
              .filter((block) => block.block_type !== "practice")
              .map((block) => (
                <LessonBlockRenderer
                  key={block.id}
                  block={block}
                />
              ))}

            <LessonMiniQuiz
              lessonId={lesson.id}
              questions={questions}
              userId={userId}
              onCompleted={() => {
                setCompleted(true);
                setInitialProgress(100);
              }}
            />
          </div>

          <section className="mt-10 rounded-3xl border border-teal-300/20 bg-teal-300/[0.05] p-6">
            <p className="font-bold text-teal-300">
              Consolida lo aprendido
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Practica solamente este contenido
            </h2>
            <p className="mt-3 leading-7 text-slate-400">
              PAESLab seleccionará preguntas vinculadas directamente
              con esta lección y te entregará diagnóstico por
              alternativa.
            </p>
            <Link
              href={`/practicar-leccion/${lesson.id}`}
              className="mt-5 inline-block rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950"
            >
              Iniciar práctica específica
            </Link>
          </section>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {previousLesson ? (
              <Link
                href={`/aprender/leccion/${previousLesson.slug}`}
                className="rounded-2xl border border-white/10 p-5 hover:border-indigo-300"
              >
                <span className="text-sm text-slate-500">
                  ← Lección anterior
                </span>
                <strong className="mt-2 block">
                  {previousLesson.title}
                </strong>
              </Link>
            ) : (
              <div />
            )}

            {nextLesson && (
              <Link
                href={`/aprender/leccion/${nextLesson.slug}`}
                className="rounded-2xl border border-white/10 p-5 text-right hover:border-teal-300"
              >
                <span className="text-sm text-slate-500">
                  Siguiente lección →
                </span>
                <strong className="mt-2 block">
                  {nextLesson.title}
                </strong>
              </Link>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/mi-plan"
              className="rounded-xl border border-amber-300/30 px-5 py-3 text-center font-black text-amber-200"
            >
              Ver mi plan
            </Link>
            <Link
              href="/ruta-estudio"
              className="rounded-xl border border-indigo-300/30 px-5 py-3 text-center font-black text-indigo-200"
            >
              Continuar mi ruta
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
