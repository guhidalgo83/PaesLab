"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QuestionVisual from "@/components/QuestionVisual";

type ConfidenceLevel =
  | "muy_seguro"
  | "algo_seguro"
  | "dude"
  | "adivine";

type Question = {
  id: string;
  test_type: "M1" | "M2";
  axis: string;
  unit_name: string;
  skill: string;
  difficulty: "Básico" | "Medio" | "Avanzado";
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  estimated_seconds: number;
  distractor_feedback: string[] | null;
  common_error_tags: string[] | null;
  critical_step: string | null;
  visual_type: string | null;
  visual_data: Record<string, unknown> | null;
  image_url: string | null;
  image_alt: string | null;
};

type TestFilter = "Todas" | "M1" | "M2";

const confidenceOptions: {
  value: ConfidenceLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "muy_seguro",
    label: "Muy seguro",
    description: "Conocía el procedimiento.",
  },
  {
    value: "algo_seguro",
    label: "Algo seguro",
    description: "Tenía una duda menor.",
  },
  {
    value: "dude",
    label: "Dudé bastante",
    description: "Elegí entre dos alternativas.",
  },
  {
    value: "adivine",
    label: "Adiviné",
    description: "No sabía cómo resolverla.",
  },
];

export default function TrainingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [testFilter, setTestFilter] = useState<TestFilter>("Todas");
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [finished, setFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void initialize();
  }, []);

  async function initialize() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);
    await loadQuestions("Todas", user.id);
    setLoading(false);
  }

  async function loadQuestions(filter: TestFilter, explicitUserId?: string) {
    setLoading(true);
    setErrorMessage("");
    setFinished(false);
    setIndex(0);
    setSelectedIndex(null);
    setConfidence(null);
    setAnswered(false);
    setCorrectAnswers(0);
    setSessionId(null);

    let query = supabase
      .from("questions")
      .select(
        [
          "id",
          "test_type",
          "axis",
          "unit_name",
          "skill",
          "difficulty",
          "prompt",
          "options",
          "correct_index",
          "explanation",
          "estimated_seconds",
          "distractor_feedback",
          "common_error_tags",
          "critical_step",
          "visual_type",
          "visual_data",
          "image_url",
          "image_alt",
        ].join(","),
      )
      .eq("is_active", true)
      .limit(200);

    if (filter !== "Todas") {
      query = query.eq("test_type", filter);
    }

    const { data, error } = await query;

    if (error) {
      setErrorMessage(error.message);
      setQuestions([]);
      setLoading(false);
      return;
    }

    const shuffled = [...((data ?? []) as unknown as Question[])]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10) as Question[];

    setQuestions(shuffled);
    setStartedAt(Date.now());

    const uid =
      explicitUserId ??
      userId ??
      (await supabase.auth.getUser()).data.user?.id ??
      null;

    if (uid && shuffled.length > 0) {
      const { data: session, error: sessionError } = await supabase
        .from("practice_sessions")
        .insert({
          user_id: uid,
          mode: "practice",
          test_type: filter === "Todas" ? null : filter,
          total_questions: shuffled.length,
          correct_answers: 0,
          completed: false,
        })
        .select("id")
        .single();

      if (sessionError) {
        setErrorMessage(
          `Las preguntas cargaron, pero no fue posible crear la sesión: ${sessionError.message}`,
        );
      } else if (session) {
        setSessionId(session.id);
      }
    }

    setLoading(false);
  }

  function selectAnswer(optionIndex: number) {
    if (answered) return;
    setSelectedIndex(optionIndex);
    setConfidence(null);
    setErrorMessage("");
  }

  function getDiagnosedErrorTag(
    question: Question,
    chosenIndex: number,
  ): string | null {
    if (
      chosenIndex === question.correct_index ||
      !question.common_error_tags?.length
    ) {
      return null;
    }

    const wrongOptionIndexes = question.options
      .map((_, optionIndex) => optionIndex)
      .filter((optionIndex) => optionIndex !== question.correct_index);

    const positionAmongWrongOptions =
      wrongOptionIndexes.indexOf(chosenIndex);

    if (positionAmongWrongOptions < 0) return null;

    return question.common_error_tags[positionAmongWrongOptions] ?? null;
  }

  async function confirmAnswer() {
    if (
      answered ||
      savingAnswer ||
      selectedIndex === null ||
      !confidence ||
      !questions[index] ||
      !userId
    ) {
      return;
    }

    setSavingAnswer(true);
    setErrorMessage("");

    const question = questions[index];
    const isCorrect = selectedIndex === question.correct_index;
    const responseSeconds = Math.max(
      1,
      Math.round((Date.now() - startedAt) / 1000),
    );
    const diagnosedErrorTag = getDiagnosedErrorTag(
      question,
      selectedIndex,
    );

    setAnswered(true);

    if (isCorrect) {
      setCorrectAnswers((value) => value + 1);
    }

    const { error } = await supabase.from("question_attempts").insert({
      user_id: userId,
      session_id: sessionId,
      question_id: question.id,
      selected_index: selectedIndex,
      is_correct: isCorrect,
      response_seconds: responseSeconds,
      confidence_level: confidence,
      diagnosed_error_tag: diagnosedErrorTag,
    });

    if (error) {
      setErrorMessage(
        `La respuesta se corrigió, pero no pudo guardarse: ${error.message}`,
      );
    }

    setSavingAnswer(false);
  }

  async function nextQuestion() {
    if (index + 1 >= questions.length) {
      await finishSession();
      return;
    }

    setIndex((value) => value + 1);
    setSelectedIndex(null);
    setConfidence(null);
    setAnswered(false);
    setErrorMessage("");
    setStartedAt(Date.now());
  }

  async function finishSession() {
    if (sessionId) {
      const { error } = await supabase
        .from("practice_sessions")
        .update({
          correct_answers: correctAnswers,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) {
        setErrorMessage(
          `El entrenamiento terminó, pero la sesión no pudo cerrarse: ${error.message}`,
        );
      }
    }

    setFinished(true);
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <p className="text-slate-400">Cargando preguntas...</p>
      </main>
    );
  }

  if (finished) {
    const score = questions.length
      ? Math.round((correctAnswers / questions.length) * 100)
      : 0;

    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
        <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center">
          <div className="text-5xl">🏆</div>
          <h1 className="mt-5 text-4xl font-black">
            Entrenamiento completado
          </h1>
          <p className="mt-6 text-6xl font-black text-teal-300">
            {score}%
          </p>
          <p className="mt-3 text-slate-400">
            {correctAnswers} respuestas correctas de {questions.length}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => void loadQuestions(testFilter)}
              className="rounded-xl bg-teal-300 px-6 py-3 font-black text-slate-950"
            >
              Practicar nuevamente
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/15 px-6 py-3 font-black"
            >
              Ver dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const question = questions[index];

  if (!question) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
        <section className="max-w-xl text-center">
          <h1 className="text-3xl font-black">
            No encontramos preguntas
          </h1>
          <p className="mt-3 text-slate-400">
            Revisa que el banco esté cargado y que las preguntas estén
            activas.
          </p>

          {errorMessage && (
            <div className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-left text-sm text-rose-200">
              <strong>Error de Supabase:</strong>
              <p className="mt-2 break-words">{errorMessage}</p>
            </div>
          )}

          <button
            onClick={() => void loadQuestions(testFilter)}
            className="mt-6 rounded-xl bg-teal-300 px-6 py-3 font-black text-slate-950"
          >
            Volver a intentar
          </button>
        </section>
      </main>
    );
  }

  const isCorrect =
    answered && selectedIndex === question.correct_index;

  const selectedFeedback =
    selectedIndex !== null
      ? question.distractor_feedback?.[selectedIndex] ?? null
      : null;

  const progress =
    ((index + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 to-indigo-400 text-xl font-black text-slate-950">
              π
            </span>
            <span className="text-xl font-black">MathLabs</span>
          </Link>

          <div className="flex gap-2">
            {(["Todas", "M1", "M2"] as TestFilter[]).map((value) => (
              <button
                key={value}
                disabled={savingAnswer}
                onClick={() => {
                  setTestFilter(value);
                  void loadQuestions(value);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  testFilter === value
                    ? "bg-teal-300 text-slate-950"
                    : "border border-white/10 text-slate-300"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </header>

        <section className="py-10">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              Pregunta {index + 1} de {questions.length}
            </span>
            <span>
              {question.test_type} · {question.difficulty}
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-300 to-indigo-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <article className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-9">
            <p className="font-bold uppercase tracking-[0.15em] text-teal-300">
              {question.axis}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {question.unit_name} · {question.skill}
            </p>

            <h1 className="mt-7 text-2xl font-black leading-relaxed sm:text-3xl">
              {question.prompt}
            </h1>

            <QuestionVisual
              visualType={question.visual_type}
              visualData={question.visual_data}
              imageUrl={question.image_url}
              imageAlt={question.image_alt}
            />

            <div className="mt-8 grid gap-4">
              {question.options.map((option, optionIndex) => {
                const selected = selectedIndex === optionIndex;
                const correctOption =
                  answered && optionIndex === question.correct_index;
                const wrongSelected =
                  answered &&
                  selected &&
                  optionIndex !== question.correct_index;

                return (
                  <button
                    key={`${question.id}-${optionIndex}`}
                    disabled={answered || savingAnswer}
                    onClick={() => selectAnswer(optionIndex)}
                    className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                      correctOption
                        ? "border-emerald-400 bg-emerald-400/10"
                        : wrongSelected
                          ? "border-rose-400 bg-rose-400/10"
                          : selected
                            ? "border-teal-300 bg-teal-300/10"
                            : "border-white/10 bg-slate-900/70 hover:border-teal-300"
                    }`}
                  >
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-white/10 font-black text-teal-300">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="font-semibold">{option}</span>
                  </button>
                );
              })}
            </div>

            {selectedIndex !== null && !answered && (
              <section className="mt-7 rounded-2xl border border-indigo-300/20 bg-indigo-300/[0.06] p-5">
                <h2 className="text-lg font-black">
                  Antes de corregir: ¿qué tan seguro estás?
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Esta información permite diferenciar dominio real,
                  conocimiento frágil y respuestas por azar.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {confidenceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setConfidence(option.value)}
                      className={`rounded-xl border p-4 text-left ${
                        confidence === option.value
                          ? "border-teal-300 bg-teal-300/10"
                          : "border-white/10 bg-slate-900/70"
                      }`}
                    >
                      <strong className="block">{option.label}</strong>
                      <span className="mt-1 block text-xs text-slate-400">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  disabled={!confidence || savingAnswer}
                  onClick={() => void confirmAnswer()}
                  className="mt-5 w-full rounded-xl bg-teal-300 px-6 py-4 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingAnswer
                    ? "Guardando respuesta..."
                    : "Confirmar y corregir"}
                </button>
              </section>
            )}

            {answered && (
              <div
                className={`mt-7 rounded-2xl border p-5 ${
                  isCorrect
                    ? "border-emerald-400/30 bg-emerald-400/10"
                    : "border-rose-400/30 bg-rose-400/10"
                }`}
              >
                <p className="text-lg font-black">
                  {isCorrect
                    ? "✓ Respuesta correcta"
                    : "✕ Respuesta incorrecta"}
                </p>

                {!isCorrect && selectedFeedback && (
                  <div className="mt-5 rounded-xl border border-rose-300/20 bg-slate-950/30 p-4">
                    <p className="text-sm font-black uppercase tracking-wide text-rose-200">
                      Qué ocurrió en tu razonamiento
                    </p>
                    <p className="mt-2 leading-7 text-slate-200">
                      {selectedFeedback}
                    </p>
                  </div>
                )}

                <div className="mt-5">
                  <p className="text-sm font-black uppercase tracking-wide text-teal-200">
                    Resolución
                  </p>
                  <p className="mt-2 leading-7 text-slate-200">
                    {question.explanation}
                  </p>
                </div>

                {question.critical_step && (
                  <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
                    <p className="text-sm font-black text-amber-200">
                      Paso clave que debes recordar
                    </p>
                    <p className="mt-2 leading-7 text-slate-200">
                      {question.critical_step}
                    </p>
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <p className="mt-5 rounded-xl bg-amber-300/10 px-4 py-3 text-sm text-amber-200">
                {errorMessage}
              </p>
            )}

            {answered && (
              <button
                onClick={() => void nextQuestion()}
                className="mt-7 w-full rounded-xl bg-teal-300 px-6 py-4 font-black text-slate-950"
              >
                {index + 1 === questions.length
                  ? "Ver resultado"
                  : "Siguiente pregunta →"}
              </button>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
