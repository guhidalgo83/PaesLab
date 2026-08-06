import Link from "next/link";
import type { Course } from "@/types/school";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <article className={`rounded-3xl border p-6 ${course.is_available ? "border-teal-300/25 bg-teal-300/[0.05]" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">Matemática escolar</p>
          <h2 className="mt-2 text-2xl font-black text-white">{course.name}</h2>
        </div>
        <span className={`rounded-xl px-3 py-2 text-xs font-black ${course.is_available ? "bg-emerald-300/10 text-emerald-200" : "bg-white/10 text-slate-400"}`}>
          {course.is_available ? "Disponible" : "Próximamente"}
        </span>
      </div>

      <p className="mt-4 min-h-14 leading-7 text-slate-400">{course.description}</p>

      {course.is_available ? (
        <Link href={`/matematica/${course.slug}`} className="mt-6 inline-block rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950">
          Ver curso
        </Link>
      ) : (
        <span className="mt-6 inline-block rounded-xl border border-white/10 px-5 py-3 font-bold text-slate-500">
          En planificación
        </span>
      )}
    </article>
  );
}
