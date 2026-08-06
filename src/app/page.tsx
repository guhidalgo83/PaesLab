import Link from "next/link";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";

const modules = [
  {
    title: "Diagnóstico y ruta",
    description: "Descubre tus fortalezas y brechas para recibir una secuencia de estudio construida desde tu nivel actual.",
    href: "/diagnostico-escolar",
    action: "Comenzar diagnóstico",
    accent: "text-violet-300",
  },
  {
    title: "Matemática escolar",
    description: "Avanza desde 5.º básico con contenidos organizados por curso, objetivos y conocimientos previos.",
    href: "/matematica",
    action: "Explorar cursos",
    accent: "text-teal-300",
  },
  {
    title: "Mi colegio y agenda",
    description: "Selecciona tu establecimiento, registra pruebas y reúne los temas que debes revisar esta semana.",
    href: "/mi-colegio",
    action: "Abrir mi espacio",
    accent: "text-sky-300",
  },
  {
    title: "Preparación PAES",
    description: "Mantén acceso a entrenamiento M1, simulacros, historial y práctica adaptativa dentro de MathLabs.",
    href: "/paes",
    action: "Entrar a PAES",
    accent: "text-indigo-300",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="font-black uppercase tracking-[0.2em] text-teal-300">
              Aprendizaje matemático continuo
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight sm:text-6xl lg:text-7xl">
              MathLabs detecta tus brechas y convierte cada error en una ruta.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
              Combina tu curso, tu colegio, tus próximas evaluaciones y tu dominio real para decidir qué aprender, practicar y repasar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/diagnostico-escolar" className="rounded-xl bg-teal-300 px-6 py-4 font-black text-slate-950">
                Descubrir mi nivel
              </Link>
              <Link href="/configurar-perfil" className="rounded-xl border border-white/15 px-6 py-4 font-black">
                Configurar mi curso
              </Link>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-teal-300/10 via-indigo-300/5 to-transparent p-7">
            <p className="text-sm font-black text-teal-300">Tu ciclo de aprendizaje</p>
            <div className="mt-6 space-y-4">
              {[
                "Diagnostica habilidades y conocimientos previos",
                "Recibe prioridades explicadas",
                "Estudia y practica cada tema",
                "Actualiza tu dominio con nueva evidencia",
              ].map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 font-black text-indigo-200">
                    {index + 1}
                  </span>
                  <span className="font-bold">{step}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <article key={module.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
              <p className={`font-black ${module.accent}`}>{module.title}</p>
              <p className="mt-4 min-h-28 leading-7 text-slate-400">{module.description}</p>
              <Link href={module.href} className="mt-6 inline-block rounded-xl border border-white/15 px-5 py-3 font-black">
                {module.action} →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
