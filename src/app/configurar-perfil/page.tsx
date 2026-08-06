"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import SchoolSelector from "@/components/mathlabs/SchoolSelector";
import { createClient } from "@/lib/supabase/client";
import type {
  Course,
  SchoolDirectoryEntry,
  StudentSchoolProfile,
  StudyGoal,
} from "@/types/school";

const GOALS: Array<{ id: StudyGoal; title: string; description: string }> = [
  { id: "follow_course", title: "Seguir mi curso", description: "Avanzar con los contenidos correspondientes a mi nivel." },
  { id: "reinforce", title: "Reforzar bases", description: "Recuperar conocimientos anteriores que todavía me cuestan." },
  { id: "prepare_test", title: "Preparar una prueba", description: "Organizar contenidos y fechas desde mi agenda personal." },
  { id: "free_practice", title: "Practicar libremente", description: "Elegir temas y resolver ejercicios a mi ritmo." },
  { id: "paes", title: "Preparar la PAES", description: "Usar las rutas M1 y M2 dentro de MathLabs." },
];

export default function ConfigureProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<SchoolDirectoryEntry | null>(null);
  const [studyGoal, setStudyGoal] = useState<StudyGoal>("follow_course");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function initialize() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/login");
      return;
    }

    const [courseResult, profileResult, enrollmentResult] = await Promise.all([
      supabase.from("courses").select("*").eq("is_published", true).order("sort_order"),
      supabase.from("student_school_profiles").select("*").eq("user_id", authData.user.id).maybeSingle(),
      supabase.from("student_course_enrollments").select("course_id").eq("user_id", authData.user.id).eq("is_primary", true).maybeSingle(),
    ]);

    const loadedCourses = (courseResult.data ?? []) as unknown as Course[];
    setCourses(loadedCourses);

    const profile = profileResult.data as unknown as StudentSchoolProfile | null;
    setSelectedCourseId(
      profile?.course_id
      ?? enrollmentResult.data?.course_id
      ?? loadedCourses.find((course) => course.is_available)?.id
      ?? "",
    );
    setStudyGoal(profile?.study_goal ?? "follow_course");

    if (profile?.school_id) {
      const { data: school } = await supabase
        .from("school_directory")
        .select("*")
        .eq("id", profile.school_id)
        .maybeSingle();
      setSelectedSchool((school as unknown as SchoolDirectoryEntry | null) ?? null);
    }

    if (courseResult.error || profileResult.error) {
      setMessage(courseResult.error?.message ?? profileResult.error?.message ?? "No pudimos cargar el perfil.");
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initialize();
  }, []);

  async function saveProfile() {
    if (!selectedCourseId) return;
    setSaving(true);
    setMessage("");

    const { error } = await supabase.rpc("set_my_school_context", {
      p_course_id: selectedCourseId,
      p_school_id: selectedSchool?.id ?? null,
      p_study_goal: studyGoal,
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    router.push("/mi-colegio");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-5xl px-5 py-14">
        <p className="font-black text-teal-300">Perfil académico</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">Configura tu contexto de estudio</h1>
        <p className="mt-5 max-w-3xl leading-8 text-slate-400">
          El curso organiza tu ruta matemática. El colegio es opcional y solo ayuda a reunir tus pruebas, temas y recomendaciones en un mismo lugar.
        </p>

        {loading ? (
          <p className="mt-10 text-slate-400">Cargando perfil...</p>
        ) : (
          <div className="mt-10 space-y-8">
            <section>
              <h2 className="text-2xl font-black">1. Selecciona tu curso</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    disabled={!course.is_available}
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`rounded-2xl border p-5 text-left disabled:cursor-not-allowed disabled:opacity-45 ${selectedCourseId === course.id ? "border-teal-300 bg-teal-300/10" : "border-white/10 bg-white/[0.04]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <strong className="text-xl">{course.name}</strong>
                      <span className="text-xs font-black text-slate-400">
                        {course.is_available ? "Disponible" : "Planificado"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{course.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black">2. ¿Qué necesitas hacer?</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setStudyGoal(goal.id)}
                    className={`rounded-2xl border p-5 text-left ${studyGoal === goal.id ? "border-indigo-300 bg-indigo-300/10" : "border-white/10 bg-white/[0.04]"}`}
                  >
                    <strong>{goal.title}</strong>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{goal.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-5 text-2xl font-black">3. Selecciona tu colegio, opcional</h2>
              <SchoolSelector value={selectedSchool} onChange={setSelectedSchool} />
            </section>
          </div>
        )}

        {message && (
          <p className="mt-6 rounded-xl bg-rose-300/10 p-4 text-rose-200">{message}</p>
        )}

        <button
          type="button"
          disabled={!selectedCourseId || saving || loading}
          onClick={() => void saveProfile()}
          className="mt-9 w-full rounded-xl bg-teal-300 px-6 py-4 font-black text-slate-950 disabled:opacity-40"
        >
          {saving ? "Guardando..." : "Guardar y abrir mi espacio"}
        </button>
      </section>
    </main>
  );
}
