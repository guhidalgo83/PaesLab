"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SimulationConfig = {
  test_type?: "M1" | "M2";
  question_count?: number;
  configured_duration_minutes?: number;
  duration_minutes?: number;
  used_seconds?: number;
  auto_finished?: boolean;
  started_at?: string | null;
};

type SessionRow = {
  id: string;
  test_type: "M1" | "M2" | null;
  total_questions: number;
  correct_answers: number;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  unanswered_questions: number | null;
  marked_questions: number | null;
  score_percentage: number | null;
  simulation_config: SimulationConfig | null;
};

type QuestionRelation =
  | {
      axis: string;
      test_type: "M1" | "M2";
    }
  | {
      axis: string;
      test_type: "M1" | "M2";
    }[]
  | null;

type AttemptRow = {
  session_id: string | null;
  is_correct: boolean;
  response_seconds: number | null;
  questions: QuestionRelation;
};

type AxisStat = {
  axis: string;
  total: number;
  correct: number;
  accuracy: number;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes} min ${String(remainingSeconds).padStart(
    2,
    "0",
  )} s`;
}

function getQuestion(
  relation: QuestionRelation,
): { axis: string; test_type: "M1" | "M2" } | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

export default function SimulationHistoryPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [selectedSessionId, setSelectedSessionId] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: sessionData, error: sessionError } =
      await supabase
        .from("practice_sessions")
        .select(
          [
            "id",
            "test_type",
            "total_questions",
            "correct_answers",
            "completed",
            "started_at",
            "completed_at",
            "duration_seconds",
            "unanswered_questions",
            "marked_questions",
            "score_percentage",
            "simulation_config",
          ].join(","),
        )
        .eq("user_id", user.id)
        .eq("mode", "simulation")
        .eq("completed", true)
        .order("completed_at", { ascending: false })
        .limit(30);

    if (sessionError) {
      setErrorMessage(sessionError.message);
      setLoading(false);
      return;
    }

    const loadedSessions = (sessionData ?? []) as SessionRow[];
    setSessions(loadedSessions);
    setSelectedSessionId(loadedSessions[0]?.id ?? null);

    const sessionIds = loadedSessions.map((session) => session.id);

    if (sessionIds.length > 0) {
      const { data: attemptData, error: attemptError } =
        await supabase
          .from("question_attempts")
          .select(
            "session_id,is_correct,response_seconds,questions(axis,test_type)",
          )
          .in("session_id", sessionIds);

      if (attemptError) {
        setErrorMessage(attemptError.message);
      } else {
        setAttempts((attemptData ?? []) as AttemptRow[]);
      }
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Cargando historial de simulacros...
        </p>
      </main>
    );
  }

  const selectedSession =
    sessions.find(
      (session) => session.id === selectedSessionId,
    ) ?? null;

  const selectedAttempts = attempts.filter(
    (attempt) => attempt.session_id === selectedSessionId,
  );

  const axisMap = new Map<
    string,
    { total: number; correct: number }
  >();

  for (const attempt of selectedAttempts) {
    const question = getQuestion(attempt.questions);
    const axis = question?.axis ?? "Sin clasificar";
    const current = axisMap.get(axis) ?? {
      total: 0,
      correct: 0,
    };

    current.total += 1;
    if (attempt.is_correct) current.correct += 1;
    axisMap.set(axis, current);
  }

  const selectedAxisStats: AxisStat[] = Array.from(
    axisMap.entries(),
  )
    .map(([axis, values]) => ({
      axis,
      total: values.total,
      correct: values.correct,
      accuracy: Math.round(
        (values.correct / values.total) * 100,
      ),
    }))
    .sort((a, b) => b.total - a.total);

  const totalCorrect = sessions.reduce(
    (sum, session) => sum + session.correct_answers,
    0,
  );
  const totalQuestions = sessions.reduce(
    (sum, session) => sum + session.total_questions,
    0,
  );
  const overallAccuracy = totalQuestions
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

  const averagePercentage = sessions.length
    ? Math.round(
        sessions.reduce(
          (sum, session) =>
            sum +
            (session.score_percentage ??
              Math.round(
                (session.correct_answers /
                  Math.max(1, session.total_questions)) *
                  100,
              )),
          0,
        ) / sessions.length,
      )
    : 0;

  const bestSession =
    sessions.length > 0
      ? [...sessions].sort(
          (a, b) =>
            (b.score_percentage ?? 0) -
            (a.score_percentage ?? 0),
        )[0]
      : null;

  const latestFive = [...sessions]
    .slice(0, 5)
    .reverse();

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 to-indigo-400 text-xl font-black text-slate-950">
              π
            </span>
            <span>
              <strong className="block text-xl">
                Historial de simulacros
              </strong>
              <small className="text-slate-400">
                Evolución y análisis de desempeño
              </small>
            </span>
          </a>

          <div className="flex flex-wrap gap-3">
            <a
              href="/simulacro"
              className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-black text-slate-950"
            >
              Nuevo simulacro
            </a>
            <a
              href="/dashboard"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold"
            >
              Dashboard
            </a>
          </div>
        </header>

        <section className="py-10">
          <p className="font-bold text-teal-300">
            Rendimiento acumulado
          </p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            Tu evolución en simulacros
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-400">
            Los porcentajes son indicadores internos de PAESLab.
            No equivalen directamente a un puntaje oficial PAES.
          </p>

          {errorMessage && (
            <p className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-rose-200">
              {errorMessage}
            </p>
          )}

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Simulacros completados", sessions.length.toString()],
              ["Precisión acumulada", `${overallAccuracy}%`],
              ["Promedio por simulacro", `${averagePercentage}%`],
              [
                "Mejor resultado",
                bestSession
                  ? `${bestSession.score_percentage ?? 0}%`
                  : "—",
              ],
            ].map(([label, value]) => (
              <article
                key={label}
                className="rounded-3xl border border-white/10 bg-white/[0.05] p-6"
              >
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-3 text-4xl font-black text-teal-300">
                  {value}
                </p>
              </article>
            ))}
          </div>

          <article className="mt-6 rounded-3xl border border-white/10 bg-white/[0.05] p-7">
            <p className="font-bold text-indigo-300">
              Tendencia reciente
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Últimos cinco simulacros
            </h2>

            {latestFive.length === 0 ? (
              <p className="mt-6 text-slate-400">
                Aún no tienes simulacros completados.
              </p>
            ) : (
              <div className="mt-8 flex h-64 items-end gap-3 sm:gap-6">
                {latestFive.map((session, index) => {
                  const percentage =
                    session.score_percentage ??
                    Math.round(
                      (session.correct_answers /
                        Math.max(1, session.total_questions)) *
                        100,
                    );

                  return (
                    <div
                      key={session.id}
                      className="flex h-full flex-1 flex-col justify-end"
                    >
                      <div className="text-center text-sm font-black text-teal-300">
                        {percentage}%
                      </div>
                      <div className="mt-2 flex h-48 items-end rounded-2xl bg-white/5 p-2">
                        <div
                          className="w-full rounded-xl bg-gradient-to-t from-teal-300 to-indigo-400"
                          style={{
                            height: `${Math.max(
                              4,
                              percentage,
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="mt-3 text-center text-xs text-slate-500">
                        {session.test_type ?? "—"} · {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
              <p className="font-bold text-amber-300">
                Sesiones realizadas
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Selecciona un simulacro
              </h2>

              {sessions.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                  <p className="text-slate-400">
                    Completa un simulacro para comenzar tu historial.
                  </p>
                  <a
                    href="/simulacro"
                    className="mt-5 inline-block rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950"
                  >
                    Ir a simulacro
                  </a>
                </div>
              ) : (
                <div className="mt-6 max-h-[720px] space-y-3 overflow-y-auto pr-1">
                  {sessions.map((session) => {
                    const percentage =
                      session.score_percentage ??
                      Math.round(
                        (session.correct_answers /
                          Math.max(
                            1,
                            session.total_questions,
                          )) *
                          100,
                      );

                    return (
                      <button
                        key={session.id}
                        onClick={() =>
                          setSelectedSessionId(session.id)
                        }
                        className={`w-full rounded-2xl border p-5 text-left transition ${
                          selectedSessionId === session.id
                            ? "border-teal-300 bg-teal-300/10"
                            : "border-white/10 bg-slate-900/60 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <strong className="text-lg">
                              Simulacro {session.test_type ?? "—"}
                            </strong>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(
                                session.completed_at ??
                                  session.started_at,
                              )}
                            </p>
                          </div>
                          <span className="text-2xl font-black text-teal-300">
                            {percentage}%
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-400">
                          {session.correct_answers} correctas de{" "}
                          {session.total_questions} ·{" "}
                          {formatDuration(session.duration_seconds)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-7">
              {!selectedSession ? (
                <p className="text-slate-400">
                  Selecciona una sesión para ver su análisis.
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-teal-300">
                        Detalle del simulacro
                      </p>
                      <h2 className="mt-2 text-3xl font-black">
                        Matemática {selectedSession.test_type ?? "—"}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        {formatDate(
                          selectedSession.completed_at ??
                            selectedSession.started_at,
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-teal-300/10 px-5 py-4 text-center">
                      <p className="text-xs font-bold uppercase text-teal-200">
                        Resultado
                      </p>
                      <p className="mt-1 text-4xl font-black text-teal-300">
                        {selectedSession.score_percentage ??
                          Math.round(
                            (selectedSession.correct_answers /
                              Math.max(
                                1,
                                selectedSession.total_questions,
                              )) *
                              100,
                          )}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      [
                        "Correctas",
                        selectedSession.correct_answers,
                      ],
                      [
                        "Incorrectas",
                        Math.max(
                          0,
                          selectedSession.total_questions -
                            selectedSession.correct_answers -
                            (selectedSession.unanswered_questions ??
                              0),
                        ),
                      ],
                      [
                        "Omitidas",
                        selectedSession.unanswered_questions ?? 0,
                      ],
                      [
                        "Marcadas",
                        selectedSession.marked_questions ?? 0,
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                      >
                        <p className="text-xs text-slate-500">
                          {label}
                        </p>
                        <p className="mt-2 text-2xl font-black">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/50 p-5">
                    <div className="flex flex-wrap justify-between gap-4">
                      <span className="text-slate-400">
                        Tiempo utilizado
                      </span>
                      <strong>
                        {formatDuration(
                          selectedSession.duration_seconds,
                        )}
                      </strong>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-between gap-4">
                      <span className="text-slate-400">
                        Preguntas
                      </span>
                      <strong>
                        {selectedSession.total_questions}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="font-bold text-indigo-300">
                      Resultado por eje
                    </p>

                    {selectedAxisStats.length === 0 ? (
                      <p className="mt-4 text-slate-400">
                        No hay respuestas registradas para esta sesión.
                      </p>
                    ) : (
                      <div className="mt-5 space-y-5">
                        {selectedAxisStats.map((stat) => (
                          <div key={stat.axis}>
                            <div className="flex justify-between gap-4">
                              <div>
                                <p className="font-bold">
                                  {stat.axis}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {stat.correct} correctas de{" "}
                                  {stat.total}
                                </p>
                              </div>
                              <span className="text-xl font-black text-teal-300">
                                {stat.accuracy}%
                              </span>
                            </div>

                            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-teal-300 to-indigo-400"
                                style={{
                                  width: `${stat.accuracy}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}
