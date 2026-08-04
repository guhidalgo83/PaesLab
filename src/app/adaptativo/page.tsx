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

type AttemptHistory = {
  is_correct: boolean;
  questions:
    | {
        axis: string;
      }
    | {
        axis: string;
      }[]
    | null;
};

type AxisPerformance = {
  axis: string;
  total: number;
  correct: number;
  accuracy: number;
};

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

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function getRelationAxis(
  relation: AttemptHistory["questions"],
): string | null {
  const question = Array.isArray(relation)
    ? relation[0]
    : relation;

  return question?.axis ?? null;
}

export default function AdaptiveTrainingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [priorityAxes, setPriorityAxes] = useState<string[]>([]);
  const [axisPerformance, setAxisPerformance] = useState<
    AxisPerformance[]
  >([]);

  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    null,
  );
  const [confidence, setConfidence] =
    useState<ConfidenceLevel | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(Date.now());

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
    await buildAdaptiveSession(user.id);
    setLoading(false);
  }

  async function buildAdaptiveSession(explicitUserId?: string) {
    setLoading(true);
    setErrorMessage("");
    setFinished(false);
    setIndex(0);
    setSelectedIndex(null);
    setConfidence(null);
    setAnswered(false);
    setCorrectAnswers(0);
    setSessionId(null);

    const uid =
      explicitUserId ??
      userId ??
      (await supabase.auth.getUser()).data.user?.id ??
      null;

    if (!uid) {
      router.replace("/login");
      return;
    }

    const [historyResult, bankResult] = await Promise.all([
      supabase
        .from("question_attempts")
        .select("is_correct,questions(axis)")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
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
        .limit(1000),
    ]);

    if (bankResult.error) {
      setErrorMessage(bankResult.error.message);
      setQuestions([]);
      setLoading(false);
      return;
    }

    const bank = (bankResult.data ?? []) as Question[];

    if (bank.length === 0) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    const history = historyResult.error
      ? []
      : ((historyResult.data ?? []) as AttemptHistory[]);

    const performanceMap = new Map<
      string,
      { total: number; correct: number }
    >();

    for (const attempt of history) {
      const axis = getRelationAxis(attempt.questions);
      if (!axis) continue;

      const current = performanceMap.get(axis) ?? {
        total: 0,
        correct: 0,
      };

      current.total += 1;
      if (attempt.is_correct) current.correct += 1;
      performanceMap.set(axis, current);
    }

    const performance: AxisPerformance[] = Array.from(
      performanceMap.entries(),
    )
      .map(([axis, values]) => ({
        axis,
        total: values.total,
        correct: values.correct,
        accuracy: Math.round(
          (values.correct / values.total) * 100,
        ),
      }))
      .sort(
        (a, b) =>
          a.accuracy - b.accuracy || b.total - a.total,
      );

    setAxisPerformance(performance);

    const axesInBank = Array.from(
      new Set(bank.map((question) => question.axis)),
    );

    const calculatedPriorityAxes =
      performance.length > 0
        ? performance.slice(0, 2).map((item) => item.axis)
        : shuffle(axesInBank).slice(0, 2);

    setPriorityAxes(calculatedPriorityAxes);

    const priorityQuestions = shuffle(
      bank.filter((question) =>
        calculatedPriorityAxes.includes(question.axis),
      ),
    );

    const supportQuestions = shuffle(
      bank.filter(
        (question) =>
          !calculatedPriorityAxes.includes(question.axis),
      ),
    );

    let selected = [
      ...priorityQuestions.slice(0, 6),
      ...supportQuestions.slice(0, 4),
    ];

    if (selected.length < 10) {
      const selectedIds = new Set(
        selected.map((question) => question.id),
      );

      const additional = shuffle(
        bank.filter(
          (question) => !selectedIds.has(question.id),
        ),
      ).slice(0, 10 - selected.length);

      selected = [...selected, ...additional];
    }

    selected = shuffle(selected).slice(0, 10);
    setQuestions(selected);
    setStartedAt(Date.now());

    const { data: session, error: sessionError } =
      await supabase
        .from("practice_sessions")
        .insert({
          user_id: uid,
          mode: "adaptive",
          test_type: null,
          total_questions: selected.length,
          correct_answers: 0,
          completed: false,
        })
        .select("id")
        .single();

    if (sessionError) {
      setErrorMessage(
        `La sesión cargó, pero no pudo registrarse: ${sessionError.message}`,
      );
    } else if (session) {
      setSessionId(session.id);
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
      .filter(
        (optionIndex) =>
          optionIndex !== question.correct_index,
      );

    const positionAmongWrongOptions =
      wrongOptionIndexes.indexOf(chosenIndex);

    if (positionAmongWrongOptions < 0) return null;

    return (
      question.common_error_tags[
        positionAmongWrongOptions
      ] ?? null
    );
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
    const isCorrect =
      selectedIndex === question.correct_index;
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
        diagnosed_error_tag: diagnosedErrorTag,
      });

    if (error) {
      setErrorMessage(
        `La respuesta fue corregida, pero no pudo guardarse: ${error.message}`,
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
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
        <section className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-teal-300" />
          <p className="mt-5 text-slate-400">
            Analizando tu historial y preparando una sesión
            personalizada...
          </p>
        </section>
      </main>
    );
  }

  if (finished) {
    const score = questions.length
      ? Math.round(
          (correctAnswers / questions.length) * 100,
        )
      : 0;

    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 py-10 text-white">
        <section className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center">
          <p className="font-bold text-teal-300">
            Sesión adaptativa finalizada
          </p>
          <h1 className="mt-3 text-4xl font-black">
            Resultado personalizado
          </h1>

          <p className="mt-7 text-7xl font-black text-teal-300">
            {score}%
          </p>
          <p className="mt-3 text-slate-400">
            {correctAnswers} respuestas correctas de{" "}
            {questions.length}
          </p>

          <div className="mt-8 rounded-2xl border border-indigo-300/20 bg-indigo-300/[0.06] p-5 text-left">
            <p className="font-black text-indigo-200">
              Contenidos priorizados
            </p>
            <p className="mt-2 text-slate-300">
              {priorityAxes.length
                ? priorityAxes.join(" · ")
                : "Entrenamiento general"}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => void buildAdaptiveSession()}
              className="rounded-xl bg-teal-300 px-6 py-3 font-black text-slate-950"
            >
              Nueva sesión adaptativa
            </button>

            <Link
              href="/dashboard"
              className="rounded-xl border border-white/15 px-6 py-3 font-black"
            >
              Ver diagnóstico
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
            No fue posible crear la sesión
          </h1>
          <p className="mt-3 text-slate-400">
            Revisa que existan preguntas activas.
          </p>

          {errorMessage && (
            <p className="mt-5 rounded-xl bg-rose-400/10 p-4 text-rose-200">
              {errorMessage}
            </p>
          )}

          <button
            onClick={() => void buildAdaptiveSession()}
            className="mt-6 rounded-xl bg-teal-300 px-6 py-3 font-black text-slate-950"
          >
            Volver a intentar
          </button>
        </section>
      </main>
    );
  }

  const isCorrect =
    answered &&
    selectedIndex === question.correct_index;

  const selectedFeedback =
    selectedIndex !== null
      ? question.distractor_feedback?.[selectedIndex] ??
        null
      : null;

  const progress =
    ((index + (answered ? 1 : 0)) / questions.length) *
    100;

  const historicalPriority = axisPerformance
    .filter((item) => priorityAxes.includes(item.axis))
    .map(
      (item) =>
        `${item.axis}: ${item.accuracy}% de precisión`,
    );

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 to-indigo-400 text-xl font-black text-slate-950">
              π
            </span>
            <span>
              <strong className="block text-xl">
                PAESLab Adaptativo
              </strong>
              <small className="text-slate-400">
                Sesión diseñada según tu desempeño
              </small>
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold"
          >
            Ver diagnóstico
          </Link>
        </header>

        <section className="py-8">
          <article className="rounded-2xl border border-teal-300/20 bg-teal-300/[0.06] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-teal-300">
                  Prioridad de esta sesión
                </p>
                <p className="mt-2 text-xl font-black">
                  {priorityAxes.join(" · ")}
                </p>
                {historicalPriority.length > 0 && (
                  <p className="mt-2 text-sm text-slate-400">
                    {historicalPriority.join(" · ")}
                  </p>
                )}
              </div>

              <span className="rounded-xl bg-slate-950/40 px-4 py-2 text-sm font-bold text-slate-300">
                60% prioritario · 40% refuerzo general
              </span>
            </div>
          </article>

          <div className="mt-8 flex items-center justify-between text-sm text-slate-400">
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
              {question.options.map(
                (option, optionIndex) => {
                  const selected =
                    selectedIndex === optionIndex;
                  const correctOption =
                    answered &&
                    optionIndex ===
                      question.correct_index;
                  const wrongSelected =
                    answered &&
                    selected &&
                    optionIndex !==
                      question.correct_index;

                  return (
                    <button
                      key={`${question.id}-${optionIndex}`}
                      disabled={answered || savingAnswer}
                      onClick={() =>
                        selectAnswer(optionIndex)
                      }
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
                        {String.fromCharCode(
                          65 + optionIndex,
                        )}
                      </span>
                      <span className="font-semibold">
                        {option}
                      </span>
                    </button>
                  );
                },
              )}
            </div>

            {selectedIndex !== null && !answered && (
              <section className="mt-7 rounded-2xl border border-indigo-300/20 bg-indigo-300/[0.06] p-5">
                <h2 className="text-lg font-black">
                  ¿Qué tan seguro estás?
                </h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {confidenceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setConfidence(option.value)
                      }
                      className={`rounded-xl border p-4 text-left ${
                        confidence === option.value
                          ? "border-teal-300 bg-teal-300/10"
                          : "border-white/10 bg-slate-900/70"
                      }`}
                    >
                      <strong className="block">
                        {option.label}
                      </strong>
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
                    ? "Guardando..."
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
                      Patrón detectado
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
                      Paso clave
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
                  ? "Ver resultado adaptativo"
                  : "Siguiente pregunta →"}
              </button>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
