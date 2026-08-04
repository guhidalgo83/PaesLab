"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QuestionVisual from "@/components/QuestionVisual";
import LearningHeader from "@/components/learning/LearningHeader";

type ConfidenceLevel =
  | "muy_seguro"
  | "algo_seguro"
  | "dude"
  | "adivine";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  distractor_feedback: string[] | null;
  common_error_tags: string[] | null;
  critical_step: string | null;
  visual_type: string | null;
  visual_data: Record<string, unknown> | null;
  image_url: string | null;
  image_alt: string | null;
};

type Lesson = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  unit_id: string;
};

type Unit = {
  axis: string;
  test_type: "M1" | "M2";
};

const confidenceOptions: Array<{
  value: ConfidenceLevel;
  label: string;
}> = [
  { value: "muy_seguro", label: "Muy seguro" },
  { value: "algo_seguro", label: "Algo seguro" },
  { value: "dude", label: "Dudé bastante" },
  { value: "adivine", label: "Adiviné" },
];

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export default function LessonPracticePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null);
  const [confidence, setConfidence] =
    useState<ConfidenceLevel | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void initialize();
  }, [params]);

  async function initialize() {
    setLoading(true);
    const lessonId = String(params.lessonId ?? "");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    const { data: lessonData, error: lessonError } =
      await supabase
        .from("lessons")
        .select("id,slug,title,summary,unit_id")
        .eq("id", lessonId)
        .eq("is_published", true)
        .maybeSingle();

    if (lessonError || !lessonData) {
      setMessage(
        lessonError?.message ?? "Lección no encontrada.",
      );
      setLoading(false);
      return;
    }

    const currentLesson = lessonData as Lesson;
    setLesson(currentLesson);

    const { data: unitData } = await supabase
      .from("learning_units")
      .select("axis,test_type")
      .eq("id", currentLesson.unit_id)
      .single();

    const currentUnit = unitData as Unit;
    setUnit(currentUnit);

    const { data: linkData } = await supabase
      .from("lesson_question_links")
      .select(
        [
          "sort_order,questions(",
          "id,prompt,options,correct_index,explanation,",
          "distractor_feedback,common_error_tags,critical_step,",
          "visual_type,visual_data,image_url,image_alt",
          ")",
        ].join(""),
      )
      .eq("lesson_id", currentLesson.id)
      .in("purpose", ["practice", "challenge", "mini_quiz"])
      .order("sort_order")
      .limit(20);

    let linked = (linkData ?? [])
      .map((row: any) =>
        Array.isArray(row.questions)
          ? row.questions[0]
          : row.questions,
      )
      .filter(Boolean) as Question[];

    if (linked.length < 10) {
      const { data: fallback } = await supabase
        .from("questions")
        .select(
          [
            "id,prompt,options,correct_index,explanation,",
            "distractor_feedback,common_error_tags,critical_step,",
            "visual_type,visual_data,image_url,image_alt",
          ].join(""),
        )
        .eq("is_active", true)
        .eq("test_type", currentUnit.test_type)
        .eq("axis", currentUnit.axis)
        .limit(30);

      linked = [
        ...linked,
        ...((fallback ?? []) as Question[]).filter(
          (question) =>
            !linked.some((item) => item.id === question.id),
        ),
      ];
    }

    const selected = shuffle(linked).slice(0, 10);
    setQuestions(selected);
    setStartedAt(Date.now());

    const { data: session, error: sessionError } =
      await supabase
        .from("practice_sessions")
        .insert({
          user_id: user.id,
          mode: "lesson",
          test_type: currentUnit.test_type,
          total_questions: selected.length,
          correct_answers: 0,
          completed: false,
        })
        .select("id")
        .single();

    if (sessionError) {
      setMessage(
        `Las preguntas cargaron, pero no fue posible registrar la sesión: ${sessionError.message}`,
      );
    } else {
      setSessionId(session.id);
    }

    await supabase
      .from("study_plan_items")
      .update({
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("lesson_id", currentLesson.id)
      .eq("status", "pending");

    setLoading(false);
  }

  function getErrorTag(
    question: Question,
    chosenIndex: number,
  ): string | null {
    if (
      chosenIndex === question.correct_index ||
      !question.common_error_tags?.length
    ) {
      return null;
    }

    const wrongIndexes = question.options
      .map((_, optionIndex) => optionIndex)
      .filter(
        (optionIndex) =>
          optionIndex !== question.correct_index,
      );

    const wrongPosition = wrongIndexes.indexOf(chosenIndex);
    return wrongPosition >= 0
      ? question.common_error_tags[wrongPosition] ?? null
      : null;
  }

  async function confirmAnswer() {
    const question = questions[index];

    if (
      !question ||
      selectedIndex === null ||
      !confidence ||
      !userId ||
      answered
    ) {
      return;
    }

    const isCorrect =
      selectedIndex === question.correct_index;
    const responseSeconds = Math.max(
      1,
      Math.round((Date.now() - startedAt) / 1000),
    );

    setAnswered(true);

    if (isCorrect) {
      setCorrectAnswers((current) => current + 1);
    }

    const { error } = await supabase
      .from("question_attempts")
      .insert({
        user_id: userId,
        session_id: sessionId,
        question_id: question.id,
        selected_index: selectedIndex,
        is_correct: isCorrect,
        response_seconds: responseSeconds,
        confidence_level: confidence,
        diagnosed_error_tag: getErrorTag(
          question,
          selectedIndex,
        ),
      });

    if (error) setMessage(error.message);
  }

  async function nextQuestion() {
    if (index + 1 < questions.length) {
      setIndex((current) => current + 1);
      setSelectedIndex(null);
      setConfidence(null);
      setAnswered(false);
      setStartedAt(Date.now());
      return;
    }

    if (sessionId) {
      await supabase
        .from("practice_sessions")
        .update({
          correct_answers: correctAnswers,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    }

    setFinished(true);
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        Preparando práctica específica...
      </main>
    );
  }

  if (!lesson || !unit || questions.length === 0) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
        <section className="max-w-xl text-center">
          <h1 className="text-3xl font-black">
            No fue posible preparar esta práctica
          </h1>
          <p className="mt-4 text-slate-400">{message}</p>
          <Link
            href="/aprender"
            className="mt-6 inline-block rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950"
          >
            Volver a Aprender
          </Link>
        </section>
      </main>
    );
  }

  if (finished) {
    const score = Math.round(
      (correctAnswers / questions.length) * 100,
    );

    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
        <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.05] p-8 text-center">
          <p className="font-bold text-teal-300">
            Práctica específica completada
          </p>
          <h1 className="mt-3 text-4xl font-black">
            {lesson.title}
          </h1>
          <p className="mt-7 text-7xl font-black text-teal-300">
            {score}%
          </p>
          <p className="mt-3 text-slate-400">
            {correctAnswers} correctas de {questions.length}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/aprender/leccion/${lesson.slug}`}
              className="rounded-xl border border-indigo-300/30 px-5 py-3 font-black text-indigo-200"
            >
              Volver a la lección
            </Link>
            <Link
              href="/mi-plan"
              className="rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950"
            >
              Continuar mi plan
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const question = questions[index];
  const isCorrect =
    answered &&
    selectedIndex === question.correct_index;
  const selectedFeedback =
    selectedIndex !== null
      ? question.distractor_feedback?.[selectedIndex] ?? null
      : null;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <LearningHeader
          title="Práctica específica"
          subtitle={lesson.title}
        />

        <section className="py-10">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              Pregunta {index + 1} de {questions.length}
            </span>
            <span>{unit.axis}</span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-300 to-indigo-400"
              style={{
                width: `${
                  ((index + (answered ? 1 : 0)) /
                    questions.length) *
                  100
                }%`,
              }}
            />
          </div>

          <article className="mt-7 rounded-3xl border border-white/10 bg-white/[0.05] p-6 sm:p-8">
            <h1 className="text-2xl font-black leading-relaxed sm:text-3xl">
              {question.prompt}
            </h1>

            <QuestionVisual
              visualType={question.visual_type}
              visualData={question.visual_data}
              imageUrl={question.image_url}
              imageAlt={question.image_alt}
            />

            <div className="mt-7 grid gap-3">
              {question.options.map((option, optionIndex) => {
                const selected =
                  selectedIndex === optionIndex;
                const correctOption =
                  answered &&
                  optionIndex === question.correct_index;
                const wrongSelected =
                  answered &&
                  selected &&
                  !correctOption;

                return (
                  <button
                    key={optionIndex}
                    disabled={answered}
                    onClick={() =>
                      setSelectedIndex(optionIndex)
                    }
                    className={`flex items-center gap-4 rounded-2xl border p-4 text-left ${
                      correctOption
                        ? "border-emerald-300 bg-emerald-300/10"
                        : wrongSelected
                          ? "border-rose-300 bg-rose-300/10"
                          : selected
                            ? "border-teal-300 bg-teal-300/10"
                            : "border-white/10 bg-slate-900/70"
                    }`}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 font-black text-teal-300">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="font-semibold">{option}</span>
                  </button>
                );
              })}
            </div>

            {selectedIndex !== null && !answered && (
              <section className="mt-6 rounded-2xl border border-indigo-300/20 bg-indigo-300/[0.06] p-5">
                <p className="font-black">
                  ¿Qué tan seguro estás?
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {confidenceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setConfidence(option.value)
                      }
                      className={`rounded-xl border p-4 text-left font-bold ${
                        confidence === option.value
                          ? "border-teal-300 bg-teal-300/10"
                          : "border-white/10 bg-slate-900/70"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <button
                  disabled={!confidence}
                  onClick={() => void confirmAnswer()}
                  className="mt-5 w-full rounded-xl bg-teal-300 px-5 py-4 font-black text-slate-950 disabled:opacity-40"
                >
                  Confirmar y corregir
                </button>
              </section>
            )}

            {answered && (
              <section
                className={`mt-6 rounded-2xl border p-5 ${
                  isCorrect
                    ? "border-emerald-300/30 bg-emerald-300/10"
                    : "border-rose-300/30 bg-rose-300/10"
                }`}
              >
                <p className="text-lg font-black">
                  {isCorrect
                    ? "✓ Respuesta correcta"
                    : "✕ Respuesta incorrecta"}
                </p>

                {!isCorrect && selectedFeedback && (
                  <div className="mt-4 rounded-xl bg-slate-950/30 p-4">
                    <p className="text-sm font-black text-rose-200">
                      Error detectado
                    </p>
                    <p className="mt-2 leading-7 text-slate-300">
                      {selectedFeedback}
                    </p>
                  </div>
                )}

                <p className="mt-5 leading-7 text-slate-300">
                  {question.explanation}
                </p>

                {question.critical_step && (
                  <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-4">
                    <p className="font-black text-amber-200">
                      Paso clave
                    </p>
                    <p className="mt-2 text-slate-300">
                      {question.critical_step}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => void nextQuestion()}
                  className="mt-5 w-full rounded-xl bg-teal-300 px-5 py-4 font-black text-slate-950"
                >
                  {index + 1 === questions.length
                    ? "Ver resultado"
                    : "Siguiente pregunta →"}
                </button>
              </section>
            )}

            {message && (
              <p className="mt-5 rounded-xl bg-amber-300/10 p-4 text-amber-200">
                {message}
              </p>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
