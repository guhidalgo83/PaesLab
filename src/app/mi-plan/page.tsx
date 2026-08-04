"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LearningHeader from "@/components/learning/LearningHeader";

type PlanStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "dismissed";

type UnitRelation =
  | {
      axis: string;
      title: string;
      test_type: "M1" | "M2";
    }
  | {
      axis: string;
      title: string;
      test_type: "M1" | "M2";
    }[]
  | null;

type LessonRelation =
  | {
      id: string;
      slug: string;
      title: string;
      summary: string;
      estimated_minutes: number;
      difficulty: string;
      learning_units: UnitRelation;
    }
  | {
      id: string;
      slug: string;
      title: string;
      summary: string;
      estimated_minutes: number;
      difficulty: string;
      learning_units: UnitRelation;
    }[]
  | null;

type PlanItem = {
  id: string;
  lesson_id: string;
  reason: string;
  priority: number;
  status: PlanStatus;
  due_date: string | null;
  created_at: string;
  lessons: LessonRelation;
};

function getLesson(item: PlanItem) {
  return Array.isArray(item.lessons)
    ? item.lessons[0] ?? null
    : item.lessons;
}

function getUnit(lesson: ReturnType<typeof getLesson>) {
  if (!lesson) return null;
  return Array.isArray(lesson.learning_units)
    ? lesson.learning_units[0] ?? null
    : lesson.learning_units;
}

function priorityLabel(priority: number) {
  if (priority >= 5) return "Prioridad máxima";
  if (priority === 4) return "Prioridad alta";
  if (priority === 3) return "Prioridad media";
  return "Prioridad normal";
}

export default function MyStudyPlanPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void initialize();
  }, []);

  async function initialize() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);
    await refreshRecommendations(false);
    setLoading(false);
  }

  async function refreshRecommendations(showResult = true) {
    setRefreshing(true);
    setMessage("");

    const { data, error } = await supabase.rpc(
      "refresh_my_study_plan",
      {
        p_days: 45,
        p_max_items: 8,
      },
    );

    if (error) {
      setMessage(
        `No se pudieron actualizar las recomendaciones: ${error.message}`,
      );
    } else if (showResult) {
      setMessage(
        Number(data) > 0
          ? `Se actualizaron ${data} recomendaciones usando tus errores recientes.`
          : "Tu plan ya estaba actualizado o aún no hay suficientes errores vinculados.",
      );
    }

    await loadItems();
    setRefreshing(false);
  }

  async function loadItems() {
    const { data, error } = await supabase
      .from("study_plan_items")
      .select(
        [
          "id",
          "lesson_id",
          "reason",
          "priority",
          "status",
          "due_date",
          "created_at",
          "lessons(",
          "id,slug,title,summary,estimated_minutes,difficulty,",
          "learning_units(axis,title,test_type)",
          ")",
        ].join(""),
      )
      .in("status", ["pending", "in_progress", "completed"])
      .order("status", { ascending: false })
      .order("priority", { ascending: false })
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems((data ?? []) as PlanItem[]);
  }

  async function changeStatus(
    item: PlanItem,
    status: PlanStatus,
  ) {
    if (!userId) return;

    const { error } = await supabase
      .from("study_plan_items")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("user_id", userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    await loadItems();
  }

  function startLesson(item: PlanItem) {
    const lesson = getLesson(item);
    if (!lesson) return;

    void changeStatus(item, "in_progress");
    router.push(`/aprender/leccion/${lesson.slug}`);
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        Analizando tus errores y construyendo tu plan...
      </main>
    );
  }

  const activeItems = items.filter(
    (item) =>
      item.status === "pending" ||
      item.status === "in_progress",
  );
  const completedItems = items.filter(
    (item) => item.status === "completed",
  );
  const urgentItems = activeItems.filter(
    (item) => item.priority >= 4,
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <LearningHeader
          title="Mi plan de estudio"
          subtitle="Errores convertidos en acciones"
          showRoute={false}
        />

        <section className="py-12">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-bold text-amber-300">
                Plan automático
              </p>
              <h1 className="mt-2 max-w-4xl text-4xl font-black sm:text-5xl">
                Aprende exactamente lo que necesitas reforzar
              </h1>
              <p className="mt-4 max-w-3xl leading-7 text-slate-400">
                PAESLab relaciona tus respuestas incorrectas con las
                lecciones disponibles. Los errores cometidos con alta
                seguridad reciben mayor prioridad.
              </p>
            </div>

            <button
              disabled={refreshing}
              onClick={() => void refreshRecommendations(true)}
              className="rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
            >
              {refreshing
                ? "Analizando..."
                : "Actualizar recomendaciones"}
            </button>
          </div>

          {message && (
            <p className="mt-6 rounded-xl border border-indigo-300/20 bg-indigo-300/[0.06] p-4 text-indigo-100">
              {message}
            </p>
          )}

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              ["Pendientes", activeItems.length],
              ["Prioridad alta", urgentItems],
              ["Completadas", completedItems.length],
            ].map(([label, value]) => (
              <article
                key={String(label)}
                className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
              >
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-black text-teal-300">
                  {value}
                </p>
              </article>
            ))}
          </div>

          {activeItems.length === 0 ? (
            <article className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <h2 className="text-2xl font-black">
                Tu plan todavía está vacío
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-400">
                Responde preguntas en entrenamiento o simulacro. Luego
                vuelve aquí para transformar los errores en una ruta
                concreta de aprendizaje.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/entrenar"
                  className="rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950"
                >
                  Entrenar
                </Link>
                <Link
                  href="/simulacro"
                  className="rounded-xl border border-white/15 px-5 py-3 font-black"
                >
                  Hacer simulacro
                </Link>
              </div>
            </article>
          ) : (
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {activeItems.map((item) => {
                const lesson = getLesson(item);
                const unit = getUnit(lesson);

                if (!lesson) return null;

                return (
                  <article
                    key={item.id}
                    className={`rounded-3xl border p-6 ${
                      item.priority >= 4
                        ? "border-amber-300/30 bg-amber-300/[0.05]"
                        : "border-white/10 bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-teal-300">
                          {unit?.axis ?? "Contenido PAES"}
                        </p>
                        <h2 className="mt-2 text-2xl font-black">
                          {lesson.title}
                        </h2>
                      </div>

                      <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-amber-200">
                        {priorityLabel(item.priority)}
                      </span>
                    </div>

                    <p className="mt-4 leading-7 text-slate-300">
                      {item.reason}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      {lesson.estimated_minutes} min ·{" "}
                      {lesson.difficulty}
                      {item.due_date
                        ? ` · Sugerida antes del ${new Intl.DateTimeFormat(
                            "es-CL",
                          ).format(new Date(`${item.due_date}T12:00:00`))}`
                        : ""}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => startLesson(item)}
                        className="rounded-xl bg-teal-300 px-4 py-3 font-black text-slate-950"
                      >
                        {item.status === "in_progress"
                          ? "Continuar lección"
                          : "Aprender ahora"}
                      </button>

                      <Link
                        href={`/practicar-leccion/${lesson.id}`}
                        className="rounded-xl border border-indigo-300/30 px-4 py-3 font-black text-indigo-200"
                      >
                        Práctica específica
                      </Link>

                      <button
                        onClick={() =>
                          void changeStatus(item, "dismissed")
                        }
                        className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-400"
                      >
                        Quitar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {completedItems.length > 0 && (
            <section className="mt-12">
              <p className="font-bold text-emerald-300">
                Trabajo completado
              </p>
              <h2 className="mt-2 text-3xl font-black">
                Lecciones resueltas desde tu plan
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {completedItems.slice(0, 8).map((item) => {
                  const lesson = getLesson(item);
                  if (!lesson) return null;

                  return (
                    <Link
                      key={item.id}
                      href={`/aprender/leccion/${lesson.slug}`}
                      className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-5"
                    >
                      <p className="text-sm font-bold text-emerald-300">
                        ✓ Completada
                      </p>
                      <h3 className="mt-2 text-xl font-black">
                        {lesson.title}
                      </h3>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
