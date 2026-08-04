"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QuestionVisual from "@/components/QuestionVisual";
import VisualEditor from "@/components/VisualEditor";

type TestType = "M1" | "M2";
type Difficulty = "Básico" | "Medio" | "Avanzado";
type StatusFilter = "Todas" | "Activas" | "Inactivas";
type TestFilter = "Todas" | TestType;
type DifficultyFilter = "Todas" | Difficulty;
type VisualFilter = "Todas" | "Con visual" | "Sin visual";

type Question = {
  id: string;
  test_type: TestType;
  axis: string;
  unit_name: string;
  skill: string;
  difficulty: Difficulty;
  difficulty_level: number | null;
  context_type: string;
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  distractor_feedback: string[];
  common_error_tags: string[];
  critical_step: string;
  estimated_seconds: number;
  is_active: boolean;
  source: string;
  review_status: string;
  visual_type: string;
  visual_data: Record<string, unknown>;
  image_url: string;
  image_alt: string;
};

const defaultFeedback = [
  "Respuesta correcta.",
  "Explica el error asociado a esta alternativa.",
  "Explica el error asociado a esta alternativa.",
  "Explica el error asociado a esta alternativa.",
];

const emptyQuestion: Question = {
  id: "",
  test_type: "M1",
  axis: "Números",
  unit_name: "",
  skill: "Resolver problemas",
  difficulty: "Medio",
  difficulty_level: 3,
  context_type: "Texto",
  prompt: "",
  options: ["", "", "", ""],
  correct_index: 0,
  explanation: "",
  distractor_feedback: [...defaultFeedback],
  common_error_tags: [],
  critical_step: "",
  estimated_seconds: 120,
  is_active: true,
  source: "Original PAESLab",
  review_status: "Pendiente",
  visual_type: "none",
  visual_data: {},
  image_url: "",
  image_alt: "",
};

function difficultyLevel(difficulty: Difficulty): number {
  if (difficulty === "Básico") return 2;
  if (difficulty === "Avanzado") return 4;
  return 3;
}

function normalizeQuestion(
  value: Partial<Question>,
  fallbackId = "",
): Question {
  const options = Array.isArray(value.options)
    ? value.options.slice(0, 4).map(String)
    : ["", "", "", ""];

  while (options.length < 4) options.push("");

  const correctIndex =
    Number.isInteger(value.correct_index) &&
    Number(value.correct_index) >= 0 &&
    Number(value.correct_index) <= 3
      ? Number(value.correct_index)
      : 0;

  const feedback = Array.isArray(value.distractor_feedback)
    ? value.distractor_feedback.slice(0, 4).map(String)
    : [...defaultFeedback];

  while (feedback.length < 4) {
    feedback.push("Explica el error asociado a esta alternativa.");
  }

  feedback[correctIndex] = "Respuesta correcta.";

  const difficulty =
    value.difficulty === "Básico" ||
    value.difficulty === "Avanzado"
      ? value.difficulty
      : "Medio";

  return {
    id: String(value.id ?? fallbackId).trim().toUpperCase(),
    test_type: value.test_type === "M2" ? "M2" : "M1",
    axis: String(value.axis ?? "Números").trim(),
    unit_name: String(value.unit_name ?? "").trim(),
    skill: String(value.skill ?? "Resolver problemas").trim(),
    difficulty,
    difficulty_level:
      typeof value.difficulty_level === "number"
        ? value.difficulty_level
        : difficultyLevel(difficulty),
    context_type: String(value.context_type ?? "Texto").trim(),
    prompt: String(value.prompt ?? "").trim(),
    options,
    correct_index: correctIndex,
    explanation: String(value.explanation ?? "").trim(),
    distractor_feedback: feedback,
    common_error_tags: Array.isArray(value.common_error_tags)
      ? value.common_error_tags.map(String).filter(Boolean)
      : [],
    critical_step: String(value.critical_step ?? "").trim(),
    estimated_seconds:
      typeof value.estimated_seconds === "number"
        ? value.estimated_seconds
        : 120,
    is_active: value.is_active !== false,
    source: String(value.source ?? "Original PAESLab").trim(),
    review_status: String(value.review_status ?? "Pendiente").trim(),
    visual_type: String(value.visual_type ?? "none"),
    visual_data:
      value.visual_data && typeof value.visual_data === "object" && !Array.isArray(value.visual_data)
        ? (value.visual_data as Record<string, unknown>)
        : {},
    image_url: String(value.image_url ?? "").trim(),
    image_alt: String(value.image_alt ?? "").trim(),
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState<Question>(emptyQuestion);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [testFilter, setTestFilter] =
    useState<TestFilter>("Todas");
  const [axisFilter, setAxisFilter] = useState("Todos");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("Todas");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("Todas");
  const [visualFilter, setVisualFilter] =
    useState<VisualFilter>("Todas");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  useEffect(() => {
    void initialize();
  }, []);

  async function initialize() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    await loadQuestions();
    setLoading(false);
  }

  async function loadQuestions() {
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
          "difficulty_level",
          "context_type",
          "prompt",
          "options",
          "correct_index",
          "explanation",
          "distractor_feedback",
          "common_error_tags",
          "critical_step",
          "estimated_seconds",
          "is_active",
          "source",
          "review_status",
          "visual_type",
          "visual_data",
          "image_url",
          "image_alt",
        ].join(","),
      )
      .order("id", { ascending: true })
      .limit(2000);

    if (error) {
      showMessage(error.message, true);
      return;
    }

    setQuestions(
      (data ?? []).map((question) =>
        normalizeQuestion(question as Partial<Question>),
      ),
    );
  }

  function showMessage(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  function updateOption(index: number, value: string) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    }));
  }

  function updateFeedback(index: number, value: string) {
    setForm((current) => ({
      ...current,
      distractor_feedback: current.distractor_feedback.map(
        (feedback, feedbackIndex) =>
          feedbackIndex === index ? value : feedback,
      ),
    }));
  }

  function selectCorrectIndex(index: number) {
    setForm((current) => {
      const feedback = [...current.distractor_feedback];

      if (
        feedback[current.correct_index] === "Respuesta correcta."
      ) {
        feedback[current.correct_index] =
          "Explica el error asociado a esta alternativa.";
      }

      feedback[index] = "Respuesta correcta.";

      return {
        ...current,
        correct_index: index,
        distractor_feedback: feedback,
      };
    });
  }

  function editQuestion(question: Question) {
    setEditingId(question.id);
    const normalized = normalizeQuestion(question);
    setForm(normalized);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function duplicateQuestion(question: Question) {
    const suffix = Date.now().toString().slice(-6);

    setEditingId(null);
    const duplicated = normalizeQuestion({
        ...question,
        id: `${question.id}-COPIA-${suffix}`,
        review_status: "Pendiente",
      });
    setForm(duplicated);
    setMessage(
      "Se creó una copia en el formulario. Revisa el ID y guarda.",
    );
    setIsError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyQuestion,
      options: [...emptyQuestion.options],
      distractor_feedback: [...defaultFeedback],
    });
    setMessage("");
  }

  function validateQuestion(question: Question) {
    if (!question.id.trim()) {
      throw new Error(
        "Debes escribir un ID único, por ejemplo M1-141.",
      );
    }

    if (!question.prompt.trim()) {
      throw new Error("Debes escribir el enunciado.");
    }

    if (question.options.some((option) => !option.trim())) {
      throw new Error("Debes completar las cuatro alternativas.");
    }

    if (new Set(question.options.map((option) => option.trim())).size < 4) {
      throw new Error(
        "Las cuatro alternativas deben ser diferentes.",
      );
    }

    if (!question.explanation.trim()) {
      throw new Error("Debes escribir la resolución.");
    }
  }

  function questionPayload(question: Question) {
    const normalized = normalizeQuestion(question);
    validateQuestion(normalized);

    return {
      id: normalized.id,
      test_type: normalized.test_type,
      axis: normalized.axis,
      unit_name: normalized.unit_name,
      skill: normalized.skill,
      difficulty: normalized.difficulty,
      difficulty_level: difficultyLevel(normalized.difficulty),
      context_type: normalized.context_type,
      prompt: normalized.prompt,
      options: normalized.options.map((option) => option.trim()),
      correct_index: normalized.correct_index,
      explanation: normalized.explanation,
      distractor_feedback: normalized.distractor_feedback,
      common_error_tags: normalized.common_error_tags,
      critical_step: normalized.critical_step,
      estimated_seconds: normalized.estimated_seconds,
      is_active: normalized.is_active,
      source: normalized.source,
      review_status: normalized.review_status,
      visual_type: normalized.visual_type,
      visual_data: normalized.visual_data,
      image_url: normalized.image_url || null,
      image_alt: normalized.image_alt || null,
    };
  }

  async function saveQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = questionPayload(form);

      const query = editingId
        ? supabase
            .from("questions")
            .update(payload)
            .eq("id", editingId)
        : supabase.from("questions").insert(payload);

      const { error } = await query;

      if (error) throw error;

      resetForm();
      await loadQuestions();

      showMessage(
        editingId
          ? "Pregunta actualizada correctamente."
          : "Pregunta creada correctamente.",
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible guardar.",
        true,
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleQuestion(question: Question) {
    const { error } = await supabase
      .from("questions")
      .update({ is_active: !question.is_active })
      .eq("id", question.id);

    if (error) {
      showMessage(error.message, true);
      return;
    }

    await loadQuestions();
  }

  async function deleteQuestion(question: Question) {
    const confirmed = window.confirm(
      `¿Eliminar definitivamente la pregunta ${question.id}?`,
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", question.id);

    if (error) {
      showMessage(
        `${error.message}. Si tiene respuestas asociadas, conviene desactivarla.`,
        true,
      );
      return;
    }

    showMessage("Pregunta eliminada.");
    await loadQuestions();
  }

  async function bulkSetActive(active: boolean) {
    if (filteredQuestions.length === 0) return;

    const action = active ? "activar" : "desactivar";
    const confirmed = window.confirm(
      `¿Deseas ${action} las ${filteredQuestions.length} preguntas filtradas?`,
    );

    if (!confirmed) return;

    const ids = filteredQuestions.map((question) => question.id);

    for (const chunk of chunkArray(ids, 200)) {
      const { error } = await supabase
        .from("questions")
        .update({ is_active: active })
        .in("id", chunk);

      if (error) {
        showMessage(error.message, true);
        return;
      }
    }

    showMessage(
      `${filteredQuestions.length} preguntas fueron ${
        active ? "activadas" : "desactivadas"
      }.`,
    );
    await loadQuestions();
  }

  async function importJson(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setImporting(true);
    setMessage("");

    try {
      const content = await file.text();
      const parsed: unknown = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        throw new Error(
          "El JSON debe contener una lista de preguntas.",
        );
      }

      const normalized = parsed.map((item, index) => {
        if (!item || typeof item !== "object") {
          throw new Error(
            `El registro ${index + 1} no es una pregunta válida.`,
          );
        }

        const question = normalizeQuestion(
          item as Partial<Question>,
        );

        validateQuestion(question);
        return {
          id: question.id,
          test_type: question.test_type,
          axis: question.axis,
          unit_name: question.unit_name,
          skill: question.skill,
          difficulty: question.difficulty,
          difficulty_level: difficultyLevel(question.difficulty),
          context_type: question.context_type,
          prompt: question.prompt,
          options: question.options,
          correct_index: question.correct_index,
          explanation: question.explanation,
          distractor_feedback: question.distractor_feedback,
          common_error_tags: question.common_error_tags,
          critical_step: question.critical_step,
          estimated_seconds: question.estimated_seconds,
          is_active: question.is_active,
          source: question.source,
          review_status: question.review_status,
          visual_type: question.visual_type,
          visual_data: question.visual_data,
          image_url: question.image_url || null,
          image_alt: question.image_alt || null,
        };
      });

      const confirmed = window.confirm(
        `Se importarán o actualizarán ${normalized.length} preguntas. ¿Continuar?`,
      );

      if (!confirmed) return;

      for (const chunk of chunkArray(normalized, 100)) {
        const { error } = await supabase
          .from("questions")
          .upsert(chunk, { onConflict: "id" });

        if (error) throw error;
      }

      await loadQuestions();
      showMessage(
        `${normalized.length} preguntas importadas correctamente.`,
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "No fue posible importar el archivo.",
        true,
      );
    } finally {
      setImporting(false);
    }
  }

  function exportFilteredJson() {
    const content = JSON.stringify(filteredQuestions, null, 2);
    const blob = new Blob([content], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `paeslab-preguntas-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const axes = useMemo(
    () =>
      Array.from(
        new Set(questions.map((question) => question.axis)),
      ).sort(),
    [questions],
  );

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const searchable =
        `${question.id} ${question.prompt} ${question.axis} ${question.unit_name} ${question.skill}`.toLowerCase();

      const matchesSearch = searchable.includes(
        search.toLowerCase(),
      );
      const matchesTest =
        testFilter === "Todas" ||
        question.test_type === testFilter;
      const matchesAxis =
        axisFilter === "Todos" ||
        question.axis === axisFilter;
      const matchesDifficulty =
        difficultyFilter === "Todas" ||
        question.difficulty === difficultyFilter;
      const matchesStatus =
        statusFilter === "Todas" ||
        (statusFilter === "Activas"
          ? question.is_active
          : !question.is_active);
      const hasVisual =
        Boolean(question.visual_type) && question.visual_type !== "none";
      const matchesVisual =
        visualFilter === "Todas" ||
        (visualFilter === "Con visual" ? hasVisual : !hasVisual);

      return (
        matchesSearch &&
        matchesTest &&
        matchesAxis &&
        matchesDifficulty &&
        matchesStatus &&
        matchesVisual
      );
    });
  }, [
    questions,
    search,
    testFilter,
    axisFilter,
    difficultyFilter,
    statusFilter,
    visualFilter,
  ]);

  const stats = useMemo(
    () => ({
      total: questions.length,
      m1: questions.filter(
        (question) => question.test_type === "M1",
      ).length,
      m2: questions.filter(
        (question) => question.test_type === "M2",
      ).length,
      active: questions.filter((question) => question.is_active)
        .length,
      inactive: questions.filter(
        (question) => !question.is_active,
      ).length,
      visual: questions.filter(
        (question) =>
          Boolean(question.visual_type) && question.visual_type !== "none",
      ).length,
      diagnosed: questions.filter(
        (question) =>
          question.distractor_feedback.some(
            (feedback) =>
              feedback &&
              feedback !== "Respuesta correcta." &&
              !feedback.startsWith("Explica el error"),
          ) && question.common_error_tags.length > 0,
      ).length,
    }),
    [questions],
  );

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Verificando acceso de administrador...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 to-indigo-400 text-xl font-black text-slate-950">
              π
            </span>
            <span>
              <strong className="block text-xl">
                PAESLab Admin
              </strong>
              <small className="text-slate-400">
                Banco y diagnóstico pedagógico
              </small>
            </span>
          </a>

          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-xl border border-teal-300/40 px-4 py-2 text-sm font-black text-teal-200">
              {importing ? "Importando..." : "Importar JSON"}
              <input
                type="file"
                accept=".json,application/json"
                onChange={(event) => void importJson(event)}
                disabled={importing}
                className="hidden"
              />
            </label>

            <button
              onClick={exportFilteredJson}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold"
            >
              Exportar filtradas
            </button>

            <a
              href="/dashboard"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold"
            >
              Dashboard
            </a>

            <a
              href="/entrenar"
              className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-black text-slate-950"
            >
              Probar entrenamiento
            </a>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
          {[
            ["Total", stats.total, "text-white"],
            ["M1", stats.m1, "text-teal-300"],
            ["M2", stats.m2, "text-indigo-300"],
            ["Activas", stats.active, "text-emerald-300"],
            ["Inactivas", stats.inactive, "text-amber-300"],
            ["Visuales", stats.visual, "text-cyan-300"],
            ["Con diagnóstico", stats.diagnosed, "text-rose-300"],
          ].map(([label, value, color]) => (
            <article
              key={String(label)}
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
            >
              <p className="text-sm text-slate-400">{label}</p>
              <p
                className={`mt-2 text-3xl font-black ${color}`}
              >
                {value}
              </p>
            </article>
          ))}
        </section>

        {message && (
          <div
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              isError
                ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
                : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
            }`}
          >
            {message}
          </div>
        )}

        <section className="grid gap-8 py-8 xl:grid-cols-[0.9fr_1.25fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-teal-300">
                  {editingId
                    ? "Editar pregunta"
                    : "Nueva pregunta"}
                </p>
                <h1 className="mt-2 text-3xl font-black">
                  {editingId ?? "Agregar contenido"}
                </h1>
              </div>

              {(editingId || form.id) && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-white/15 px-3 py-2 text-sm font-bold"
                >
                  Limpiar
                </button>
              )}
            </div>

            <form
              onSubmit={saveQuestion}
              className="mt-7 space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold">
                    ID
                  </span>
                  <input
                    required
                    disabled={Boolean(editingId)}
                    value={form.id}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        id: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-teal-300 disabled:opacity-60"
                    placeholder="M1-141"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Prueba
                  </span>
                  <select
                    value={form.test_type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        test_type: event.target.value as TestType,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                  >
                    <option>M1</option>
                    <option>M2</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Eje
                  </span>
                  <input
                    required
                    value={form.axis}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        axis: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Unidad
                  </span>
                  <input
                    required
                    value={form.unit_name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        unit_name: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Habilidad
                  </span>
                  <input
                    required
                    value={form.skill}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        skill: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Dificultad
                  </span>
                  <select
                    value={form.difficulty}
                    onChange={(event) => {
                      const difficulty = event.target
                        .value as Difficulty;

                      setForm({
                        ...form,
                        difficulty,
                        difficulty_level:
                          difficultyLevel(difficulty),
                      });
                    }}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                  >
                    <option>Básico</option>
                    <option>Medio</option>
                    <option>Avanzado</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Enunciado
                </span>
                <textarea
                  required
                  rows={5}
                  value={form.prompt}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      prompt: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                />
              </label>

              <VisualEditor
                visualType={form.visual_type}
                visualData={form.visual_data}
                imageUrl={form.image_url}
                imageAlt={form.image_alt}
                onVisualTypeChange={(visual_type) =>
                  setForm((current) => ({ ...current, visual_type }))
                }
                onVisualDataChange={(visual_data) =>
                  setForm((current) => ({ ...current, visual_data }))
                }
                onImageUrlChange={(image_url) =>
                  setForm((current) => ({ ...current, image_url }))
                }
                onImageAltChange={(image_alt) =>
                  setForm((current) => ({ ...current, image_alt }))
                }
              />

              <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <h2 className="font-black">
                  Alternativas y diagnóstico
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Marca la correcta y explica por qué un alumno
                  podría elegir cada distractor.
                </p>

                <div className="mt-5 space-y-5">
                  {form.options.map((option, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-white/10 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correct"
                          checked={
                            form.correct_index === index
                          }
                          onChange={() =>
                            selectCorrectIndex(index)
                          }
                        />
                        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white/10 font-black text-teal-300">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <input
                          required
                          value={option}
                          onChange={(event) =>
                            updateOption(
                              index,
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
                          placeholder={`Alternativa ${String.fromCharCode(
                            65 + index,
                          )}`}
                        />
                      </div>

                      <textarea
                        rows={2}
                        disabled={
                          form.correct_index === index
                        }
                        value={
                          form.distractor_feedback[index]
                        }
                        onChange={(event) =>
                          updateFeedback(
                            index,
                            event.target.value,
                          )
                        }
                        className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm disabled:opacity-60"
                        placeholder="Error de razonamiento asociado..."
                      />
                    </div>
                  ))}
                </div>
              </section>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Resolución completa
                </span>
                <textarea
                  required
                  rows={5}
                  value={form.explanation}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      explanation: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                  placeholder="Desarrolla la solución paso a paso."
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Paso crítico
                </span>
                <textarea
                  rows={2}
                  value={form.critical_step}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      critical_step: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                  placeholder="La idea esencial que el alumno debe recordar."
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Etiquetas de error
                </span>
                <input
                  value={form.common_error_tags.join(", ")}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      common_error_tags: event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                  placeholder="error_signos, confunde_area_perimetro"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Tiempo estimado
                  </span>
                  <input
                    type="number"
                    min={10}
                    value={form.estimated_seconds}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        estimated_seconds: Number(
                          event.target.value,
                        ),
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold">
                    Estado de revisión
                  </span>
                  <input
                    value={form.review_status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        review_status: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      is_active: event.target.checked,
                    })
                  }
                />
                <span className="font-bold">
                  Pregunta activa
                </span>
              </label>

              <button
                disabled={saving}
                className="w-full rounded-xl bg-teal-300 px-6 py-4 font-black text-slate-950 disabled:opacity-60"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Crear pregunta"}
              </button>
            </form>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <div className="flex flex-col gap-5">
              <div>
                <p className="font-bold text-indigo-300">
                  Banco de preguntas
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  {filteredQuestions.length} visibles de{" "}
                  {questions.length}
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 xl:col-span-2"
                  placeholder="Buscar ID, tema o enunciado..."
                />

                <select
                  value={testFilter}
                  onChange={(event) =>
                    setTestFilter(
                      event.target.value as TestFilter,
                    )
                  }
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                >
                  <option>Todas</option>
                  <option>M1</option>
                  <option>M2</option>
                </select>

                <select
                  value={difficultyFilter}
                  onChange={(event) =>
                    setDifficultyFilter(
                      event.target
                        .value as DifficultyFilter,
                    )
                  }
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                >
                  <option>Todas</option>
                  <option>Básico</option>
                  <option>Medio</option>
                  <option>Avanzado</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as StatusFilter,
                    )
                  }
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                >
                  <option>Todas</option>
                  <option>Activas</option>
                  <option>Inactivas</option>
                </select>

                <select
                  value={visualFilter}
                  onChange={(event) =>
                    setVisualFilter(event.target.value as VisualFilter)
                  }
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                >
                  <option>Todas</option>
                  <option>Con visual</option>
                  <option>Sin visual</option>
                </select>
              </div>

              <select
                value={axisFilter}
                onChange={(event) =>
                  setAxisFilter(event.target.value)
                }
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
              >
                <option>Todos</option>
                {axes.map((axis) => (
                  <option key={axis}>{axis}</option>
                ))}
              </select>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void bulkSetActive(true)}
                  className="rounded-xl bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-200"
                >
                  Activar filtradas
                </button>
                <button
                  onClick={() => void bulkSetActive(false)}
                  className="rounded-xl bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-200"
                >
                  Desactivar filtradas
                </button>
              </div>
            </div>

            <div className="mt-7 max-h-[1600px] space-y-4 overflow-y-auto pr-1">
              {filteredQuestions.map((question) => {
                const hasDiagnostic =
                  question.common_error_tags.length > 0 &&
                  question.distractor_feedback.some(
                    (feedback) =>
                      feedback &&
                      feedback !== "Respuesta correcta." &&
                      !feedback.startsWith(
                        "Explica el error",
                      ),
                  );

                return (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/75 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg bg-teal-300/10 px-2 py-1 text-xs font-bold text-teal-300">
                          {question.id}
                        </span>
                        <span className="rounded-lg bg-indigo-300/10 px-2 py-1 text-xs font-bold text-indigo-200">
                          {question.test_type}
                        </span>
                        <span className="rounded-lg bg-white/10 px-2 py-1 text-xs">
                          {question.difficulty}
                        </span>
                        {question.visual_type !== "none" && (
                          <span className="rounded-lg bg-cyan-300/10 px-2 py-1 text-xs font-bold text-cyan-200">Visual</span>
                        )}
                        {hasDiagnostic && (
                          <span className="rounded-lg bg-rose-300/10 px-2 py-1 text-xs font-bold text-rose-200">
                            Diagnóstico
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-xs font-bold ${
                          question.is_active
                            ? "text-emerald-300"
                            : "text-slate-500"
                        }`}
                      >
                        {question.is_active
                          ? "Activa"
                          : "Inactiva"}
                      </span>
                    </div>

                    <p className="mt-4 font-bold leading-6">
                      {question.prompt}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {question.axis} · {question.unit_name} ·{" "}
                      {question.skill}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        onClick={() => setPreviewQuestion(question)}
                        className="rounded-lg bg-cyan-400/15 px-3 py-2 text-sm font-bold text-cyan-200"
                      >
                        Vista previa
                      </button>

                      <button
                        onClick={() =>
                          editQuestion(question)
                        }
                        className="rounded-lg bg-indigo-400/15 px-3 py-2 text-sm font-bold text-indigo-200"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() =>
                          duplicateQuestion(question)
                        }
                        className="rounded-lg bg-teal-400/15 px-3 py-2 text-sm font-bold text-teal-200"
                      >
                        Duplicar
                      </button>

                      <button
                        onClick={() =>
                          void toggleQuestion(question)
                        }
                        className="rounded-lg bg-amber-400/15 px-3 py-2 text-sm font-bold text-amber-200"
                      >
                        {question.is_active
                          ? "Desactivar"
                          : "Activar"}
                      </button>

                      <button
                        onClick={() =>
                          void deleteQuestion(question)
                        }
                        className="rounded-lg bg-rose-400/15 px-3 py-2 text-sm font-bold text-rose-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      </div>

      {previewQuestion && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Vista previa de ${previewQuestion.id}`}
        >
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl sm:p-9">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-cyan-300">
                  Vista del estudiante · {previewQuestion.id}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {previewQuestion.test_type} · {previewQuestion.axis} · {previewQuestion.difficulty}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="rounded-xl border border-white/15 px-4 py-2 font-black"
              >
                Cerrar
              </button>
            </div>

            <h2 className="mt-8 text-2xl font-black leading-relaxed sm:text-3xl">
              {previewQuestion.prompt}
            </h2>

            <QuestionVisual
              visualType={previewQuestion.visual_type}
              visualData={previewQuestion.visual_data}
              imageUrl={previewQuestion.image_url}
              imageAlt={previewQuestion.image_alt}
            />

            <div className="mt-8 grid gap-3">
              {previewQuestion.options.map((option, optionIndex) => (
                <div
                  key={`${previewQuestion.id}-preview-${optionIndex}`}
                  className={`flex items-center gap-4 rounded-2xl border p-4 ${
                    optionIndex === previewQuestion.correct_index
                      ? "border-emerald-400/40 bg-emerald-400/10"
                      : "border-white/10 bg-slate-900/70"
                  }`}
                >
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-white/10 font-black text-teal-300">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="font-semibold">{option}</span>
                  {optionIndex === previewQuestion.correct_index && (
                    <span className="ml-auto text-xs font-black text-emerald-300">
                      CORRECTA
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-2xl border border-teal-300/20 bg-teal-300/[0.06] p-5">
              <p className="text-sm font-black uppercase tracking-wide text-teal-200">
                Resolución
              </p>
              <p className="mt-3 leading-7 text-slate-200">
                {previewQuestion.explanation}
              </p>
              {previewQuestion.critical_step && (
                <p className="mt-4 border-t border-white/10 pt-4 text-amber-200">
                  <strong>Paso crítico:</strong> {previewQuestion.critical_step}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
