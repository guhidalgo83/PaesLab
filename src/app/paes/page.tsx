import Link from "next/link";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";

export default function PaesHubPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <p className="font-black text-indigo-300">MathLabs PAES</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">Preparación M1 dentro de una trayectoria completa</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
          Todo lo construido continúa disponible: contenidos profundos, entrenamiento, práctica adaptativa, simulacros e historial.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["Aprender M1", "Lecciones, ejemplos resueltos y práctica guiada.", "/aprender"],
            ["Entrenamiento", "Práctica por eje con diagnóstico de alternativas.", "/entrenar"],
            ["Adaptativo", "Preguntas seleccionadas según tu desempeño.", "/adaptativo"],
            ["Simulacro", "Ensayo con condiciones y registro de resultados.", "/simulacro"],
            ["Historial", "Revisa sesiones y evolución de tu desempeño.", "/historial"],
            ["Mi plan", "Convierte errores recientes en acciones de estudio.", "/mi-plan"],
          ].map(([title, description, href]) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-black">{title}</h2>
              <p className="mt-3 min-h-20 leading-7 text-slate-400">{description}</p>
              <Link href={href} className="mt-5 inline-block rounded-xl bg-indigo-300 px-5 py-3 font-black text-slate-950">Abrir →</Link>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-3xl border border-teal-300/20 bg-teal-300/[0.05] p-7">
          <p className="font-black text-teal-300">Nueva visión</p>
          <h2 className="mt-2 text-3xl font-black">La PAES es una etapa, no el comienzo.</h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-400">
            MathLabs conectará las dificultades de M1 con sus prerrequisitos escolares, permitiendo volver al contenido exacto que necesita reforzarse.
          </p>
          <Link href="/matematica" className="mt-5 inline-block font-black text-teal-200">Explorar matemática escolar →</Link>
        </section>
      </section>
    </main>
  );
}
