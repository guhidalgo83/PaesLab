"use client";

import Link from "next/link";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QuestionVisual from "@/components/QuestionVisual";

type TestType = "M1" | "M2";
type QuestionCount = 10 | 20 | 30;
type DurationMinutes = 20 | 40 | 60;

type Question = {
  id: string;
  test_type: TestType;
  axis: string;
  unit_name: string;
  skill: string;
  difficulty: "Básico" | "Medio" | "Avanzado";
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  estimated_seconds: number;
  visual_type: string | null;
  visual_data: Record<string, unknown> | null;
  image_url: string | null;
  image_alt: string | null;
};

type ExamStatus = "setup" | "loading" | "running" | "finished";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    seconds,
  ).padStart(2, "0")}`;
}

export default function SimulacroPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [status, setStatus] = useState<ExamStatus>("setup");
  const [testType, setTestType] = useState<TestType>("M1");
  const [questionCount, setQuestionCount] =
    useState<QuestionCount>(20);
  const [durationMinutes, setDurationMinutes] =
    useState<DurationMinutes>(40);

  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);

  const questionStartedAtRef = useRef(Date.now());
  const timeSpentRef = useRef<Record<string, number>>({});
  const finishedRef = useRef(false);

  useEffect(() => {
    void verifyUser();
  }, []);

  useEffect(() => {
    if (status !== "running") return;

    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          window.setTimeout(() => {
            void finishExam(true);
          }, 0);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== "running") return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () =>
      window.removeEventListener("beforeunload", beforeUnload);
  }, [status]);

  async function verifyUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);
  }

  async function startExam() {
    if (!userId) {
      router.replace("/login");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    finishedRef.current = false;
    timeSpentRef.current = {};

    const { data, error } = await supabase
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
          "visual_type",
          "visual_data",
          "image_url",
          "image_alt",
        ].join(","),
      )
      .eq("is_active", true)
      .eq("test_type", testType)
      .limit(500);

    if (error) {
      setErrorMessage(error.message);
      setStatus("setup");
      return;
    }

    const selected = shuffle((data ?? []) as unknown as Question[]).slice(
      0,
      questionCount,
    );

    if (selected.length < questionCount) {
      setErrorMessage(
        `Solo hay ${selected.length} preguntas activas de ${testType}.`,
      );
      setStatus("setup");
      return;
    }

    const { data: session, error: sessionError } = await supabase
      .from("practice_sessions")
      .insert({
        user_id: userId,
        mode: "simulation",
        test_type: testType,
        total_questions: selected.length,
        correct_answers: 0,
        completed: false,
        duration_seconds: durationMinutes * 60,
        unanswered_questions: selected.length,
        marked_questions: 0,
        score_percentage: 0,
        simulation_config: {
          test_type: testType,
          question_count: selected.length,
          duration_minutes: durationMinutes,
        },
      })
      .select("id")
      .single();

    if (sessionError) {
      setErrorMessage(sessionError.message);
      setStatus("setup");
      return;
    }

    setSessionId(session.id);
    setQuestions(selected);
    setAnswers({});
    setMarked({});
    setCurrentIndex(0);
    setCorrectAnswers(0);
    setUnansweredCount(0);
    setElapsedSeconds(0);
    setTimeLeft(durationMinutes * 60);
    const startedAt = Date.now();
    setExamStartedAt(startedAt);
    questionStartedAtRef.current = startedAt;
    setStatus("running");
  }

  function captureQuestionTime() {
    const question = questions[currentIndex];
    if (!question) return;

    const elapsed = Math.max(
      1,
      Math.round(
        (Date.now() - questionStartedAtRef.current) / 1000,
      ),
    );

    timeSpentRef.current[question.id] =
      (timeSpentRef.current[question.id] ?? 0) + elapsed;

    questionStartedAtRef.current = Date.now();
  }

  function goToQuestion(index: number) {
    if (index < 0 || index >= questions.length) return;

    captureQuestionTime();
    setCurrentIndex(index);
  }

  function selectAnswer(optionIndex: number) {
    const question = questions[currentIndex];
    if (!question) return;

    setAnswers((current) => ({
      ...current,
      [question.id]: optionIndex,
    }));
  }

  function toggleMarked() {
    const question = questions[currentIndex];
    if (!question) return;

    setMarked((current) => ({
      ...current,
      [question.id]: !current[question.id],
    }));
  }

  async function finishExam(autoFinished = false) {
    if (
      finishedRef.current ||
      status !== "running" ||
      !sessionId ||
      !userId
    ) {
      return;
    }

    if (!autoFinished) {
      const unanswered = questions.filter(
        (question) => answers[question.id] === undefined,
      ).length;

      const confirmed = window.confirm(
        unanswered > 0
          ? `Aún tienes ${unanswered} preguntas sin responder. ¿Finalizar igualmente?`
          : "¿Finalizar el simulacro y ver el resultado?",
      );

      if (!confirmed) return;
    }

    finishedRef.current = true;
    setSaving(true);
    captureQuestionTime();

    const answeredQuestions = questions.filter(
      (question) => answers[question.id] !== undefined,
    );

    const correct = answeredQuestions.filter(
      (question) =>
        answers[question.id] === question.correct_index,
    ).length;

    const unanswered =
      questions.length - answeredQuestions.length;

    const attemptsPayload = answeredQuestions.map((question) => ({
      user_id: userId,
      session_id: sessionId,
      question_id: question.id,
      selected_index: answers[question.id],
      is_correct:
        answers[question.id] === question.correct_index,
      response_seconds:
        timeSpentRef.current[question.id] ?? 1,
      confidence_level: null,
      diagnosed_error_tag: null,
    }));

    if (attemptsPayload.length > 0) {
      const { error: attemptsError } = await supabase
        .from("question_attempts")
        .insert(attemptsPayload);

      if (attemptsError) {
        setErrorMessage(
          `El resultado se calculó, pero algunas respuestas no pudieron guardarse: ${attemptsError.message}`,
        );
      }
    }

    const usedSeconds =
      durationMinutes * 60 - Math.max(0, timeLeft);

    const { error: sessionError } = await supabase
      .from("practice_sessions")
      .update({
        correct_answers: correct,
        completed: true,
        completed_at: new Date().toISOString(),
        duration_seconds: usedSeconds,
        unanswered_questions: unanswered,
        marked_questions: Object.values(marked).filter(Boolean).length,
        score_percentage: questions.length
          ? Math.round((correct / questions.length) * 100)
          : 0,
        simulation_config: {
          test_type: testType,
          question_count: questions.length,
          configured_duration_minutes: durationMinutes,
          used_seconds: usedSeconds,
          auto_finished: autoFinished,
          started_at: examStartedAt
            ? new Date(examStartedAt).toISOString()
            : null,
        },
      })
      .eq("id", sessionId);

    if (sessionError) {
      setErrorMessage(
        `El resultado se calculó, pero la sesión no pudo cerrarse: ${sessionError.message}`,
      );
    }

    setCorrectAnswers(correct);
    setUnansweredCount(unanswered);
    setElapsedSeconds(usedSeconds);
    setSaving(false);
    setStatus("finished");
  }

  function resetExam() {
    setStatus("setup");
    setSessionId(null);
    setQuestions([]);
    setAnswers({});
    setMarked({});
    setCurrentIndex(0);
    setErrorMessage("");
    setExamStartedAt(null);
    finishedRef.current = false;
  }

  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
        <section className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-teal-300" />
          <p className="mt-5 text-slate-400">
            Preparando tu simulacro...
          </p>
        </section>
      </main>
    );
  }

  if (status === "setup") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 py-10 text-white">
        <section className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.05] p-7 sm:p-9">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 to-indigo-400 text-xl font-black text-slate-950">
              π
            </span>
            <span>
              <strong className="block text-xl">
                PAESLab Simulacro
              </strong>
              <small className="text-slate-400">
                Práctica cronometrada
              </small>
            </span>
          </Link>

          <h1 className="mt-9 text-4xl font-black">
            Configura tu simulacro
          </h1>
          <p className="mt-3 leading-7 text-slate-400">
            Las respuestas se corregirán solamente al finalizar.
            Puedes navegar libremente y marcar preguntas para
            revisarlas.
          </p>

          <div className="mt-8 grid gap-6">
            <fieldset>
              <legend className="font-black">Prueba</legend>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(["M1", "M2"] as TestType[]).map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setTestType(value)}
                    className={`rounded-xl border p-4 font-black ${
                      testType === value
                        ? "border-teal-300 bg-teal-300/10 text-teal-200"
                        : "border-white/10 bg-slate-900"
                    }`}
                  >
                    Matemática {value}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-black">
                Cantidad de preguntas
              </legend>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {([10, 20, 30] as QuestionCount[]).map(
                  (value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setQuestionCount(value)}
                      className={`rounded-xl border p-4 font-black ${
                        questionCount === value
                          ? "border-indigo-300 bg-indigo-300/10 text-indigo-200"
                          : "border-white/10 bg-slate-900"
                      }`}
                    >
                      {value}
                    </button>
                  ),
                )}
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-black">
                Tiempo disponible
              </legend>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {([20, 40, 60] as DurationMinutes[]).map(
                  (value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setDurationMinutes(value)}
                      className={`rounded-xl border p-4 font-black ${
                        durationMinutes === value
                          ? "border-amber-300 bg-amber-300/10 text-amber-200"
                          : "border-white/10 bg-slate-900"
                      }`}
                    >
                      {value} min
                    </button>
                  ),
                )}
              </div>
            </fieldset>
          </div>

          {errorMessage && (
            <p className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-rose-200">
              {errorMessage}
            </p>
          )}

          <button
            onClick={() => void startExam()}
            className="mt-8 w-full rounded-xl bg-teal-300 px-6 py-4 font-black text-slate-950"
          >
            Comenzar simulacro
          </button>

          <Link
            href="/historial"
            className="mt-3 block w-full rounded-xl border border-white/15 px-6 py-4 text-center font-black text-slate-200"
          >
            Ver historial de simulacros
          </Link>

          <p className="mt-4 text-center text-xs text-slate-500">
            Este módulo es una práctica interna de PAESLab, no una
            reproducción de una aplicación oficial.
          </p>
        </section>
      </main>
    );
  }

  if (status === "finished") {
    const percentage = questions.length
      ? Math.round((correctAnswers / questions.length) * 100)
      : 0;

    return (
      <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
        <section className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-7 text-center sm:p-10">
            <p className="font-bold text-teal-300">
              Simulacro {testType} finalizado
            </p>
            <h1 className="mt-3 text-4xl font-black">
              Tu resultado
            </h1>
            <p className="mt-7 text-7xl font-black text-teal-300">
              {percentage}%
            </p>
            <p className="mt-3 text-slate-400">
              {correctAnswers} correctas de {questions.length}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <p className="text-sm text-slate-400">Correctas</p>
                <p className="mt-2 text-3xl font-black text-emerald-300">
                  {correctAnswers}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <p className="text-sm text-slate-400">
                  Incorrectas
                </p>
                <p className="mt-2 text-3xl font-black text-rose-300">
                  {questions.length -
                    correctAnswers -
                    unansweredCount}
                </p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <p className="text-sm text-slate-400">
                  Sin responder
                </p>
                <p className="mt-2 text-3xl font-black text-amber-300">
                  {unansweredCount}
                </p>
              </article>
            </div>

            <p className="mt-6 text-slate-400">
              Tiempo utilizado: {formatTime(elapsedSeconds)}
            </p>

            {errorMessage && (
              <p className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-left text-amber-200">
                {errorMessage}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={resetExam}
                className="rounded-xl bg-teal-300 px-6 py-3 font-black text-slate-950"
              >
                Nuevo simulacro
              </button>
              <Link
                href="/historial"
                className="rounded-xl border border-indigo-300/30 px-6 py-3 font-black text-indigo-200"
              >
                Ver historial
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-white/15 px-6 py-3 font-black"
              >
                Ver dashboard
              </Link>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {questions.map((question, index) => {
              const selected = answers[question.id];
              const answered = selected !== undefined;
              const correct =
                answered &&
                selected === question.correct_index;

              return (
                <article
                  key={question.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-black">
                      Pregunta {index + 1}
                    </p>
                    <span
                      className={`rounded-lg px-3 py-1 text-sm font-bold ${
                        !answered
                          ? "bg-amber-300/10 text-amber-200"
                          : correct
                            ? "bg-emerald-300/10 text-emerald-200"
                            : "bg-rose-300/10 text-rose-200"
                      }`}
                    >
                      {!answered
                        ? "Sin responder"
                        : correct
                          ? "Correcta"
                          : "Incorrecta"}
                    </span>
                  </div>

                  <p className="mt-4 font-bold leading-7">
                    {question.prompt}
                  </p>

                  <p className="mt-4 text-sm text-slate-400">
                    Tu respuesta:{" "}
                    {answered
                      ? `${String.fromCharCode(
                          65 + selected,
                        )}. ${question.options[selected]}`
                      : "Sin respuesta"}
                  </p>
                  <p className="mt-2 text-sm text-emerald-200">
                    Correcta:{" "}
                    {String.fromCharCode(
                      65 + question.correct_index,
                    )}
                    . {question.options[question.correct_index]}
                  </p>

                  <div className="mt-4 rounded-xl bg-slate-900/60 p-4">
                    <p className="text-sm font-black text-teal-200">
                      Resolución
                    </p>
                    <p className="mt-2 leading-7 text-slate-300">
                      {question.explanation}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  const question = questions[currentIndex];
  const answeredTotal = Object.keys(answers).length;
  const markedTotal = Object.values(marked).filter(Boolean).length;

  if (!question) return null;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="sticky top-0 z-20 rounded-2xl border border-white/10 bg-slate-950/95 p-4 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 to-indigo-400 text-xl font-black text-slate-950">
                π
              </span>
              <div>
                <strong className="block">
                  Simulacro {testType}
                </strong>
                <small className="text-slate-400">
                  {answeredTotal}/{questions.length} respondidas ·{" "}
                  {markedTotal} marcadas
                </small>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`rounded-xl px-5 py-3 font-mono text-2xl font-black ${
                  timeLeft <= 300
                    ? "bg-rose-400/15 text-rose-200"
                    : "bg-white/10 text-teal-200"
                }`}
              >
                {formatTime(timeLeft)}
              </div>

              <button
                disabled={saving}
                onClick={() => void finishExam(false)}
                className="rounded-xl bg-rose-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Finalizar"}
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_270px]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold uppercase tracking-[0.15em] text-teal-300">
                  {question.axis}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {question.unit_name} · {question.difficulty}
                </p>
              </div>

              <button
                onClick={toggleMarked}
                className={`rounded-xl border px-4 py-2 text-sm font-black ${
                  marked[question.id]
                    ? "border-amber-300 bg-amber-300/10 text-amber-200"
                    : "border-white/15 text-slate-300"
                }`}
              >
                {marked[question.id]
                  ? "★ Marcada"
                  : "☆ Marcar para revisar"}
              </button>
            </div>

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
                const selected =
                  answers[question.id] === optionIndex;

                return (
                  <button
                    key={`${question.id}-${optionIndex}`}
                    onClick={() => selectAnswer(optionIndex)}
                    className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                      selected
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

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                disabled={currentIndex === 0}
                onClick={() => goToQuestion(currentIndex - 1)}
                className="rounded-xl border border-white/15 px-5 py-3 font-bold disabled:opacity-30"
              >
                ← Anterior
              </button>

              <span className="text-sm text-slate-400">
                Pregunta {currentIndex + 1} de {questions.length}
              </span>

              <button
                disabled={
                  currentIndex === questions.length - 1
                }
                onClick={() => goToQuestion(currentIndex + 1)}
                className="rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950 disabled:opacity-30"
              >
                Siguiente →
              </button>
            </div>
          </article>

          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.05] p-5 lg:sticky lg:top-28">
            <p className="font-black">Navegación</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Verde: respondida. Amarillo: marcada. Borde claro:
              pregunta actual.
            </p>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {questions.map((item, index) => {
                const isAnswered =
                  answers[item.id] !== undefined;
                const isMarked = marked[item.id];
                const isCurrent = index === currentIndex;

                return (
                  <button
                    key={item.id}
                    onClick={() => goToQuestion(index)}
                    className={`aspect-square rounded-lg border text-sm font-black ${
                      isCurrent
                        ? "border-white"
                        : "border-transparent"
                    } ${
                      isMarked
                        ? "bg-amber-300 text-slate-950"
                        : isAnswered
                          ? "bg-emerald-300 text-slate-950"
                          : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Respondidas</span>
                <strong>{answeredTotal}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pendientes</span>
                <strong>
                  {questions.length - answeredTotal}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Marcadas</span>
                <strong>{markedTotal}</strong>
              </div>
            </div>
          </aside>
        </section>

        {errorMessage && (
          <p className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200">
            {errorMessage}
          </p>
        )}
      </div>
    </main>
  );
}
