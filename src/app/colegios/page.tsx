import Link from "next/link";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";

export default function SchoolsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="font-black text-sky-300">Contexto escolar abierto</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black sm:text-6xl">
          Tu colegio organiza el contexto. MathLabs organiza tu aprendizaje.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
          Cualquier estudiante puede seleccionar su establecimiento, registrar lo que están revisando en clases y reunir en un mismo espacio sus temas, pruebas y materiales MathLabs.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/configurar-perfil" className="rounded-xl bg-sky-300 px-6 py-4 font-black text-slate-950">
            Seleccionar colegio y curso
          </Link>
          <Link href="/mi-colegio" className="rounded-xl border border-white/15 px-6 py-4 font-black">
            Abrir mi espacio
          </Link>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {[
            ["1", "Selecciona tu colegio", "Búscalo por nombre, región y comuna. También puedes continuar sin indicar establecimiento."],
            ["2", "Registra lo que viene", "Agrega pruebas, controles, guías o contenidos vistos en clases y relaciónalos con temas matemáticos."],
            ["3", "Recibe una ruta", "MathLabs prioriza materiales según tu curso, tu agenda y los conocimientos que aún debes reforzar."],
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-300/10 font-black text-sky-200">{number}</span>
              <h2 className="mt-5 text-xl font-black">{title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{description}</p>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-3xl border border-amber-300/20 bg-amber-300/[0.04] p-7">
          <h2 className="text-2xl font-black text-amber-200">Transparencia de la información</h2>
          <p className="mt-4 max-w-4xl leading-7 text-slate-300">
            Seleccionar un colegio no significa que el establecimiento use o respalde MathLabs. Los perfiles aportados por estudiantes se identifican como información comunitaria. Cuando exista participación oficial, el perfil podrá aparecer como verificado.
          </p>
        </section>
      </section>
    </main>
  );
}
