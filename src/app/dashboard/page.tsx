"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type ConfidenceLevel =
  | "muy_seguro"
  | "algo_seguro"
  | "dude"
  | "adivine";

type QuestionRelation =
  | {
      axis: string;
      unit_name: string;
      test_type: "M1" | "M2";
    }
  | {
      axis: string;
      unit_name: string;
      test_type: "M1" | "M2";
    }[]
  | null;

type AttemptRow = {
  is_correct: boolean;
  response_seconds: number | null;
  confidence_level: ConfidenceLevel | null;
  diagnosed_error_tag: string | null;
  created_at: string;
  questions: QuestionRelation;
};

type AxisStat = {
  axis: string;
  total: number;
  correct: number;
  accuracy: number;
};

type ErrorStat = {
  tag: string;
  label: string;
  count: number;
  percentage: number;
};

const confidenceLabels: Record<ConfidenceLevel, string> = {
  muy_seguro: "Muy seguro",
  algo_seguro: "Algo seguro",
  dude: "Dudé bastante",
  adivine: "Adiviné",
};

const errorLabels: Record<string, string> = {
  confunde_descuento_precio_final: "Confunde descuento con precio final",
  operacion_inversa: "Aplica la operación inversa",
  porcentaje_como_cantidad: "Interpreta el porcentaje como una cantidad",
  confunde_razon_diferencia: "Confunde razón con diferencia",
  suma_datos: "Suma datos que debía relacionar",
  invierte_razon: "Invierte una razón",
  suma_exponentes: "Suma exponentes incorrectamente",
  modifica_base: "Modifica la base de una potencia",
  multiplica_exponentes: "Multiplica exponentes",
  suma_directa_fracciones: "Suma numeradores y denominadores directamente",
  omite_denominador_comun: "No usa denominador común",
  simplificacion_incorrecta: "Simplifica incorrectamente",
  despeje_incompleto: "Deja el despeje incompleto",
  responde_ax: "Responde el término con la incógnita",
  cambio_signo: "Cambia un signo incorrectamente",
  prioridad_operaciones: "No respeta la prioridad de operaciones",
  signo_intercepto: "Confunde el signo del intercepto",
  confunde_parametros: "Confunde parámetros de la función",
  intercambia_variables: "Intercambia las variables",
  usa_datos_como_solucion: "Usa datos del enunciado como solución",
  no_verifica: "No verifica la solución",
  cambia_sentido: "Cambia el sentido de una desigualdad",
  incluye_igualdad: "Incluye igualdad donde no corresponde",
  signos_raices: "Cambia los signos de las raíces",
  factorizacion_incorrecta: "Factoriza incorrectamente",
  confunde_suma_raices: "Confunde la suma de raíces con una solución",
  suma_catetos: "Suma los catetos",
  resta_catetos: "Resta los catetos",
  omite_cuadrados: "Omite elevar al cuadrado",
  omite_division: "Olvida dividir",
  base_incorrecta: "Usa una base incorrecta",
  divide_dos_veces: "Divide dos veces",
  usa_perimetro: "Usa perímetro en vez de área",
  omite_cuadrado: "Omite elevar el radio al cuadrado",
  confunde_radio_diametro: "Confunde radio con diámetro",
  resta_x: "Resta la componente horizontal",
  resta_y: "Resta la componente vertical",
  confunde_vector_punto: "Confunde vector con punto",
  confunde_area_perimetro: "Confunde área con perímetro",
  omite_factor_2: "Omite el factor 2",
  suma_incompleta: "Suma lados de forma incompleta",
  omite_division_media: "Olvida dividir para obtener la media",
  confunde_media_mediana: "Confunde media con mediana",
  elige_extremo: "Elige un valor extremo",
  denominador_incorrecto: "Usa un denominador incorrecto",
  usa_complemento: "Calcula el complemento",
  desplaza_posicion: "Elige una posición equivocada",
  segunda_frecuencia: "Elige un valor frecuente, pero no la moda",
  confunde_moda_media: "Confunde moda con media",
  confunde_moda_maximo: "Confunde moda con máximo",
  frecuencia_como_porcentaje: "Usa frecuencia como porcentaje",
  total_incorrecto: "Calcula un total incorrecto",
  total_incompleto: "Usa un total incompleto",
  error_exponente: "Identifica mal el exponente",
  confunde_log_division: "Confunde logaritmo con división",
  resta_base: "Resta la base al argumento",
  usa_interes_simple: "Usa interés simple",
  omite_periodos: "No considera todos los períodos",
  omite_capital: "Omite el capital inicial",
  extrae_sin_raiz: "Extrae un factor sin calcular su raíz",
  no_reconoce_conjugados: "No reconoce conjugados",
  conserva_signo: "Conserva el signo dentro del valor absoluto",
  confunde_distancia: "Confunde valor absoluto con posición",
  duplica: "Duplica el valor",
  confunde_potencia_producto: "Confunde potencia con multiplicación",
  suma_coeficiente: "Suma en vez de multiplicar",
  omite_coeficiente: "Omite el coeficiente",
  confunde_seno_coseno: "Confunde seno con coseno",
  angulo_90: "Usa el valor de 90°",
  angulo_0: "Usa el valor de 0°",
  omite_ajuste: "No ajusta el período",
  formula_incompleta: "Usa una fórmula incompleta",
  confunde_coeficiente: "Confunde coeficiente con período",
  confunde_base_exponente: "Confunde base con exponente",
  division_en_vez_log: "Divide en vez de usar exponente",
  confunde_seno_tangente: "Confunde seno con tangente",
  invierte_razon: "Invierte la razón trigonométrica",
  confunde_inscrito_central: "Confunde ángulo inscrito con central",
  duplica_arco: "Duplica el arco",
  usa_area_circulo: "Usa el área de un círculo",
  confunde_area_volumen: "Confunde área con volumen",
  factor_incorrecto: "Usa un factor incorrecto",
  invierte_pendiente: "Invierte la pendiente",
  solo_delta_x: "Usa solo el cambio en x",
  solo_delta_y: "Usa solo el cambio en y",
  usa_factor_lineal: "Usa factor lineal para un área",
  suma_factor: "Suma el factor de escala",
  usa_factor_cubico: "Usa factor cúbico para un área",
  usa_permutacion: "Cuenta el orden cuando no corresponde",
  producto_simple: "Usa un producto simple",
  potencia_incorrecta: "Usa una potencia incorrecta",
  ignora_condicion: "Ignora la condición del problema",
  calcula_evento_equivocado: "Calcula otro evento",
  usa_complemento_condicional: "Calcula el complemento condicional",
  confunde_varianza_media: "Confunde varianza con media",
  cuadrado_media: "Eleva la media al cuadrado",
  varianza_minima_uno: "Supone que la varianza mínima es uno",
  interpreta_inverso: "Interpreta la dispersión al revés",
  confunde_media_dispersion: "Confunde media con dispersión",
  ignora_desviacion: "No utiliza la desviación estándar",
  suficiencia_confunde_unicidad: "No comprueba si hay una solución única",
  usa_datos_redundantes: "Usa datos redundantes",
  condicion_amplia: "Acepta una condición demasiado amplia",
};

function humanizeTag(tag: string): string {
  return (
    errorLabels[tag] ??
    tag
      .replaceAll("_", " ")
      .replace(/^\w/, (letter) => letter.toUpperCase())
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    setUser(currentUser);

    const [attemptsResult, sessionsResult] = await Promise.all([
      supabase
        .from("question_attempts")
        .select(
          [
            "is_correct",
            "response_seconds",
            "confidence_level",
            "diagnosed_error_tag",
            "created_at",
            "questions(axis,unit_name,test_type)",
          ].join(","),
        )
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("practice_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("completed", true),
    ]);

    if (attemptsResult.error) {
      setErrorMessage(attemptsResult.error.message);
    } else {
      setAttempts((attemptsResult.data ?? []) as AttemptRow[]);
    }

    if (!sessionsResult.error) {
      setCompletedSessions(sessionsResult.count ?? 0);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Analizando tu forma de responder...
        </p>
      </main>
    );
  }

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter(
    (attempt) => attempt.is_correct,
  ).length;

  const accuracy =
    totalAttempts > 0
      ? Math.round((correctAttempts / totalAttempts) * 100)
      : 0;

  const timedAttempts = attempts.filter(
    (attempt) =>
      typeof attempt.response_seconds === "number" &&
      attempt.response_seconds > 0,
  );

  const averageSeconds =
    timedAttempts.length > 0
      ? Math.round(
          timedAttempts.reduce(
            (sum, attempt) =>
              sum + (attempt.response_seconds ?? 0),
            0,
          ) / timedAttempts.length,
        )
      : 0;

  const confidenceAttempts = attempts.filter(
    (attempt) => attempt.confidence_level,
  );

  const highConfidenceErrors = attempts.filter(
    (attempt) =>
      !attempt.is_correct &&
      attempt.confidence_level === "muy_seguro",
  ).length;

  const luckyGuesses = attempts.filter(
    (attempt) =>
      attempt.is_correct &&
      attempt.confidence_level === "adivine",
  ).length;

  const fragileCorrectAnswers = attempts.filter(
    (attempt) =>
      attempt.is_correct &&
      (attempt.confidence_level === "dude" ||
        attempt.confidence_level === "adivine"),
  ).length;

  const confidenceCounts = confidenceAttempts.reduce<
    Record<ConfidenceLevel, number>
  >(
    (accumulator, attempt) => {
      if (attempt.confidence_level) {
        accumulator[attempt.confidence_level] += 1;
      }
      return accumulator;
    },
    {
      muy_seguro: 0,
      algo_seguro: 0,
      dude: 0,
      adivine: 0,
    },
  );

  const axisMap = new Map<string, { total: number; correct: number }>();

  for (const attempt of attempts) {
    const relation = Array.isArray(attempt.questions)
      ? attempt.questions[0]
      : attempt.questions;

    const axis = relation?.axis ?? "Sin clasificar";
    const current = axisMap.get(axis) ?? {
      total: 0,
      correct: 0,
    };

    current.total += 1;
    if (attempt.is_correct) current.correct += 1;

    axisMap.set(axis, current);
  }

  const axisStats: AxisStat[] = Array.from(axisMap.entries())
    .map(([axis, values]) => ({
      axis,
      total: values.total,
      correct: values.correct,
      accuracy: Math.round(
        (values.correct / values.total) * 100,
      ),
    }))
    .sort((a, b) => b.total - a.total);

  const strongestAxis =
    axisStats.length > 0
      ? [...axisStats].sort(
          (a, b) =>
            b.accuracy - a.accuracy || b.total - a.total,
        )[0]
      : null;

  const weakestAxis =
    axisStats.length > 0
      ? [...axisStats].sort(
          (a, b) =>
            a.accuracy - b.accuracy || b.total - a.total,
        )[0]
      : null;

  const errorMap = new Map<string, number>();

  for (const attempt of attempts) {
    if (!attempt.is_correct && attempt.diagnosed_error_tag) {
      errorMap.set(
        attempt.diagnosed_error_tag,
        (errorMap.get(attempt.diagnosed_error_tag) ?? 0) + 1,
      );
    }
  }

  const totalDiagnosedErrors = Array.from(errorMap.values()).reduce(
    (sum, value) => sum + value,
    0,
  );

  const errorStats: ErrorStat[] = Array.from(errorMap.entries())
    .map(([tag, count]) => ({
      tag,
      label: humanizeTag(tag),
      count,
      percentage:
        totalDiagnosedErrors > 0
          ? Math.round((count / totalDiagnosedErrors) * 100)
          : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Estudiante";

  const hasDiagnosticData =
    confidenceAttempts.length > 0 || errorStats.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 to-indigo-400 text-xl font-black text-slate-950">
              π
            </span>
            <span className="text-xl font-black">PAESLab</span>
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/entrenar"
              className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-black text-slate-950"
            >
              Entrenar
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold hover:border-rose-300 hover:text-rose-200"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="py-12">
          <p className="font-bold text-teal-300">
            Diagnóstico del estudiante
          </p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            Hola, {displayName}
          </h1>
          <p className="mt-3 text-slate-400">{user?.email}</p>

          {errorMessage && (
            <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-rose-200">
              No fue posible cargar todas las estadísticas:{" "}
              {errorMessage}
            </div>
          )}

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Preguntas respondidas", totalAttempts.toString()],
              ["Precisión general", `${accuracy}%`],
              [
                "Tiempo promedio",
                averageSeconds ? `${averageSeconds} s` : "—",
              ],
              [
                "Sesiones completadas",
                completedSessions.toString(),
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

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
              <p className="text-sm font-bold text-rose-300">
                Errores con alta seguridad
              </p>
              <p className="mt-3 text-4xl font-black">
                {highConfidenceErrors}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Respuestas incorrectas que marcaste como “Muy
                seguro”. Son conceptos que conviene reaprender.
              </p>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
              <p className="text-sm font-bold text-amber-300">
                Aciertos por azar
              </p>
              <p className="mt-3 text-4xl font-black">
                {luckyGuesses}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Respuestas correctas que declaraste haber adivinado.
                No deben considerarse dominio consolidado.
              </p>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
              <p className="text-sm font-bold text-indigo-300">
                Conocimiento frágil
              </p>
              <p className="mt-3 text-4xl font-black">
                {fragileCorrectAnswers}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Aciertos obtenidos después de dudar o adivinar.
                Necesitan refuerzo para ser estables.
              </p>
            </article>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-7">
              <p className="font-bold text-emerald-300">
                Fortaleza principal
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {strongestAxis?.axis ?? "Aún sin datos"}
              </h2>
              <p className="mt-3 text-slate-400">
                {strongestAxis
                  ? `${strongestAxis.accuracy}% de precisión en ${strongestAxis.total} respuestas.`
                  : "Completa un entrenamiento para detectar tus fortalezas."}
              </p>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-7">
              <p className="font-bold text-amber-300">
                Contenido por reforzar
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {weakestAxis?.axis ?? "Aún sin datos"}
              </h2>
              <p className="mt-3 text-slate-400">
                {weakestAxis
                  ? `${weakestAxis.accuracy}% de precisión en ${weakestAxis.total} respuestas.`
                  : "Tus recomendaciones aparecerán después de practicar."}
              </p>
            </article>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-7">
              <p className="font-bold text-teal-300">
                Confianza declarada
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Cómo estás respondiendo
              </h2>

              {confidenceAttempts.length === 0 ? (
                <p className="mt-6 text-slate-400">
                  Completa preguntas con el nuevo selector de confianza.
                </p>
              ) : (
                <div className="mt-7 space-y-5">
                  {(
                    Object.keys(
                      confidenceLabels,
                    ) as ConfidenceLevel[]
                  ).map((level) => {
                    const count = confidenceCounts[level];
                    const percentage = Math.round(
                      (count / confidenceAttempts.length) * 100,
                    );

                    return (
                      <div key={level}>
                        <div className="flex justify-between gap-4">
                          <span className="font-bold">
                            {confidenceLabels[level]}
                          </span>
                          <span className="font-black text-teal-300">
                            {count} · {percentage}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-300 to-indigo-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-7">
              <p className="font-bold text-rose-300">
                Patrones de error
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Por qué te estás equivocando
              </h2>

              {errorStats.length === 0 ? (
                <p className="mt-6 text-slate-400">
                  Todavía no hay errores diagnosticados. Aparecerán
                  al responder las preguntas nuevas.
                </p>
              ) : (
                <div className="mt-7 space-y-5">
                  {errorStats.map((error) => (
                    <div key={error.tag}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold">{error.label}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {error.count}{" "}
                            {error.count === 1
                              ? "respuesta"
                              : "respuestas"}
                          </p>
                        </div>
                        <span className="font-black text-rose-300">
                          {error.percentage}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-300 to-amber-300"
                          style={{
                            width: `${error.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>

          <article className="mt-6 rounded-3xl border border-white/10 bg-white/[0.05] p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-bold text-indigo-300">
                  Resultados por eje
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  Tu progreso detallado
                </h2>
              </div>
              <Link
                href="/entrenar"
                className="font-bold text-teal-300 hover:text-teal-200"
              >
                Practicar ahora →
              </Link>
            </div>

            {axisStats.length === 0 ? (
              <p className="mt-6 text-slate-400">
                Todavía no hay respuestas registradas.
              </p>
            ) : (
              <div className="mt-7 space-y-6">
                {axisStats.map((stat) => (
                  <div key={stat.axis}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold">{stat.axis}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {stat.correct} correctas de {stat.total}
                        </p>
                      </div>
                      <span className="text-xl font-black text-teal-300">
                        {stat.accuracy}%
                      </span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-300 to-indigo-400"
                        style={{ width: `${stat.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          {!hasDiagnosticData && totalAttempts > 0 && (
            <div className="mt-6 rounded-2xl border border-indigo-300/20 bg-indigo-300/[0.06] p-5 text-slate-300">
              Tus respuestas anteriores siguen contabilizadas. El
              diagnóstico de confianza y patrones de error se
              construirá con las nuevas sesiones.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
