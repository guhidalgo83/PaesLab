"use client";

import { useEffect, useMemo, useState } from "react";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import CourseCard from "@/components/mathlabs/CourseCard";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/types/school";

export default function MathematicsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadCourses() {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("sort_order");

    if (error) {
      setErrorMessage(error.message);
    } else {
      setCourses((data ?? []) as unknown as Course[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCourses();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <p className="font-black text-teal-300">Matemática escolar</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Una trayectoria que crece contigo</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
          Elige tu curso para revisar objetivos, temas y progreso. MathLabs parte en 5.º básico y conservará la preparación PAES como una ruta especializada.
        </p>

        {loading && <p className="mt-10 text-slate-400">Cargando cursos...</p>}
        {errorMessage && (
          <p className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] p-5 text-rose-200">
            No se pudo cargar el mapa escolar. Ejecuta la migración 08 en Supabase. Detalle: {errorMessage}
          </p>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => <CourseCard key={course.id} course={course} />)}
        </div>
      </section>
    </main>
  );
}
