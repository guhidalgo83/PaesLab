"use client";

import Link from "next/link";

type Chapter = {
  number: number;
  unit: 1 | 2;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  lessonIds: string[];
  lessonSlug: string;
  practiceSlug: string;
};

export const fifthGradeTomoOneChapters: Chapter[] = [
  {
    number: 1,
    unit: 1,
    title: "Números grandes",
    subtitle: "Lee, forma, descompone y compara números.",
    icon: "🔢",
    color: "from-rose-300/20 to-orange-300/10",
    lessonIds: ["school-5b-num-01"],
    lessonSlug: "5b-numeros-naturales-valor-posicional",
    practiceSlug: "numeros-naturales-valor-posicional",
  },
  {
    number: 2,
    unit: 1,
    title: "Multiplicación",
    subtitle: "Usa cálculo mental, estimación y productos parciales.",
    icon: "✖️",
    color: "from-amber-300/20 to-yellow-300/10",
    lessonIds: ["school-5b-num-02", "school-5b-num-03"],
    lessonSlug: "5b-multiplicacion-dos-digitos",
    practiceSlug: "multiplicacion-de-dos-digitos",
  },
  {
    number: 3,
    unit: 1,
    title: "¿Cuántas veces?",
    subtitle: "Compara longitudes y cantidades usando división.",
    icon: "🎗️",
    color: "from-lime-300/20 to-emerald-300/10",
    lessonIds: ["school-5b-num-04"],
    lessonSlug: "5b-division-interpretacion-resto",
    practiceSlug: "division-e-interpretacion-del-resto",
  },
  {
    number: 4,
    unit: 1,
    title: "Longitud",
    subtitle: "Mide, estima y convierte mm, cm, m y km.",
    icon: "📏",
    color: "from-emerald-300/20 to-teal-300/10",
    lessonIds: ["school-5b-oa-19", "school-5b-oa-20"],
    lessonSlug: "5b-medicion-longitudes",
    practiceSlug: "medicion-de-longitudes",
  },
  {
    number: 5,
    unit: 1,
    title: "División",
    subtitle: "Resuelve divisiones y explica el resto.",
    icon: "➗",
    color: "from-cyan-300/20 to-sky-300/10",
    lessonIds: ["school-5b-num-04"],
    lessonSlug: "5b-division-interpretacion-resto",
    practiceSlug: "division-e-interpretacion-del-resto",
  },
  {
    number: 6,
    unit: 2,
    title: "Números decimales",
    subtitle: "Representa, compara, suma y resta decimales.",
    icon: "0,5",
    color: "from-sky-300/20 to-indigo-300/10",
    lessonIds: ["school-5b-frac-10", "school-5b-frac-11", "school-5b-frac-12"],
    lessonSlug: "5b-fracciones-decimales-equivalentes",
    practiceSlug: "fracciones-decimales-equivalentes",
  },
  {
    number: 7,
    unit: 2,
    title: "Patrones",
    subtitle: "Descubre reglas y predice términos.",
    icon: "🔁",
    color: "from-indigo-300/20 to-violet-300/10",
    lessonIds: ["school-5b-oa-14"],
    lessonSlug: "5b-reglas-sucesiones",
    practiceSlug: "reglas-sucesiones",
  },
  {
    number: 8,
    unit: 2,
    title: "Fracciones",
    subtitle: "Representa, transforma, compara y opera fracciones.",
    icon: "¾",
    color: "from-violet-300/20 to-fuchsia-300/10",
    lessonIds: ["school-5b-frac-07", "school-5b-frac-08", "school-5b-frac-09"],
    lessonSlug: "5b-fracciones-propias",
    practiceSlug: "fracciones-propias",
  },
  {
    number: 9,
    unit: 2,
    title: "Datos",
    subtitle: "Organiza información y crea gráficos.",
    icon: "📊",
    color: "from-fuchsia-300/20 to-rose-300/10",
    lessonIds: ["school-5b-oa-26"],
    lessonSlug: "5b-tablas-graficos",
    practiceSlug: "tablas-graficos",
  },
];

function chapterProgress(chapter: Chapter, completedLessonIds: Set<string>) {
  if (chapter.lessonIds.length === 0) return 0;
  const done = chapter.lessonIds.filter((id) => completedLessonIds.has(id)).length;
  return Math.round((done / chapter.lessonIds.length) * 100);
}

export default function FifthGradeAdventureMap({
  completedLessonIds,
  reviewScores,
}: {
  completedLessonIds: Set<string>;
  reviewScores: Record<string, number>;
}) {
  const completedChapters = fifthGradeTomoOneChapters.filter(
    (chapter) => chapterProgress(chapter, completedLessonIds) === 100,
  ).length;
  const overall = Math.round((completedChapters / fifthGradeTomoOneChapters.length) * 100);

  return (
    <div className="space-y-10">
      <section className="rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/10 via-indigo-300/[0.06] to-fuchsia-300/[0.06] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Aventura Tomo 1</p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Tu mapa de 5° básico</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Avanza por nueve capítulos. Cada misión conecta una lección visual, práctica y un desafío final.
            </p>
          </div>
          <div className="min-w-56 rounded-2xl border border-white/10 bg-slate-950/45 p-5">
            <div className="flex items-end justify-between gap-4">
              <span className="text-sm font-bold text-slate-400">Capítulos completados</span>
              <strong className="text-3xl text-cyan-200">{completedChapters}/9</strong>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300" style={{ width: `${overall}%` }} />
            </div>
          </div>
        </div>
      </section>

      {[1, 2].map((unit) => {
        const chapters = fifthGradeTomoOneChapters.filter((chapter) => chapter.unit === unit);
        const reviewSlug = unit === 1 ? "tomo-1-unidad-1" : "tomo-1-unidad-2";
        const score = reviewScores[unit === 1 ? "tomo1-unidad1" : "tomo1-unidad2"];
        return (
          <section key={unit} className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-300">Unidad {unit}</p>
                <h3 className="mt-2 text-2xl font-black text-white">
                  {unit === 1 ? "Números, operaciones y longitud" : "Decimales, patrones, fracciones y datos"}
                </h3>
              </div>
              <Link href={`/repaso-escolar/${reviewSlug}`} className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-slate-950 transition hover:-translate-y-0.5">
                {typeof score === "number" ? `Repaso: ${score}%` : "Gran desafío de unidad"} →
              </Link>
            </div>

            <div className="relative mt-7 grid gap-5 lg:grid-cols-2">
              {chapters.map((chapter) => {
                const progress = chapterProgress(chapter, completedLessonIds);
                const complete = progress === 100;
                return (
                  <article key={chapter.number} className={`relative overflow-hidden rounded-[1.75rem] border p-5 transition hover:-translate-y-1 ${complete ? "border-emerald-300/30 bg-emerald-300/[0.06]" : "border-white/10 bg-gradient-to-br " + chapter.color}`}>
                    <div className="absolute right-4 top-4 text-5xl opacity-15">{chapter.icon}</div>
                    <div className="relative">
                      <div className="flex items-start gap-4">
                        <span className={`grid h-12 w-12 flex-none place-items-center rounded-2xl font-black ${complete ? "bg-emerald-300 text-slate-950" : "bg-white/10 text-white"}`}>
                          {complete ? "✓" : chapter.number}
                        </span>
                        <div className="pr-10">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Capítulo {chapter.number}</p>
                          <h4 className="mt-1 text-xl font-black text-white">{chapter.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{chapter.subtitle}</p>
                        </div>
                      </div>
                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${complete ? "bg-emerald-300" : "bg-cyan-300"}`} style={{ width: `${progress}%` }} />
                      </div>
                      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                        <Link href={`/aprender/leccion/${chapter.lessonSlug}`} className="rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-slate-950">
                          {complete ? "Repasar lección" : "Comenzar lección"}
                        </Link>
                        <Link href={`/practica-escolar/${chapter.practiceSlug}`} className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-black text-white">
                          Practicar
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
