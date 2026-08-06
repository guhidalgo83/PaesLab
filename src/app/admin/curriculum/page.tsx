"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import { createClient } from "@/lib/supabase/client";
import type { Course, CurriculumAxis, CurriculumObjective, KnowledgeTopic } from "@/types/school";

export default function CurriculumAdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [axes, setAxes] = useState<CurriculumAxis[]>([]);
  const [objectives, setObjectives] = useState<CurriculumObjective[]>([]);
  const [topics, setTopics] = useState<KnowledgeTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function initialize() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
    if (profile?.role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    const [courseResult, axisResult, objectiveResult, topicResult] = await Promise.all([
      supabase.from("courses").select("*").order("sort_order"),
      supabase.from("curriculum_axes").select("*").order("sort_order"),
      supabase.from("curriculum_objectives").select("*").order("sort_order"),
      supabase.from("knowledge_topics").select("*").order("sort_order"),
    ]);

    if (courseResult.error || axisResult.error || objectiveResult.error || topicResult.error) {
      setMessage(courseResult.error?.message ?? axisResult.error?.message ?? objectiveResult.error?.message ?? topicResult.error?.message ?? "Error de carga");
    }

    setCourses((courseResult.data ?? []) as unknown as Course[]);
    setAxes((axisResult.data ?? []) as unknown as CurriculumAxis[]);
    setObjectives((objectiveResult.data ?? []) as unknown as CurriculumObjective[]);
    setTopics((topicResult.data ?? []) as unknown as KnowledgeTopic[]);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initialize();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader compact />
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-black text-teal-300">Administración</p>
            <h1 className="mt-2 text-4xl font-black">Mapa curricular de MathLabs</h1>
          </div>
          <Link href="/admin" className="rounded-xl border border-white/15 px-5 py-3 font-black">Volver al administrador</Link>
        </div>

        {loading && <p className="mt-8 text-slate-400">Cargando arquitectura curricular...</p>}
        {message && <p className="mt-8 rounded-xl bg-rose-300/10 p-4 text-rose-200">{message}</p>}

        <div className="mt-9 grid gap-4 sm:grid-cols-4">
          {[["Cursos", courses.length], ["Ejes", axes.length], ["Objetivos", objectives.length], ["Temas", topics.length]].map(([label, value]) => (
            <article key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-black text-teal-300">{value}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 space-y-5">
          {courses.map((course) => (
            <article key={course.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">{course.name}</h2>
                  <p className="mt-2 text-slate-400">{course.description}</p>
                </div>
                <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-300">{course.is_available ? "Disponible" : "Planificado"}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="rounded-lg bg-indigo-300/10 px-3 py-2 text-indigo-200">{axes.filter((axis) => axis.course_id === course.id).length} ejes</span>
                <span className="rounded-lg bg-teal-300/10 px-3 py-2 text-teal-200">{objectives.filter((objective) => objective.course_id === course.id).length} objetivos</span>
                <span className="rounded-lg bg-amber-300/10 px-3 py-2 text-amber-200">{topics.filter((topic) => topic.course_id === course.id).length} temas</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
