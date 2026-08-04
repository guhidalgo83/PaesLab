const ejes = [
  {
    icono: "🔢",
    nombre: "Números",
    descripcion: "Porcentajes, potencias, raíces y números reales.",
  },
  {
    icono: "📈",
    nombre: "Álgebra y funciones",
    descripcion: "Ecuaciones, funciones, sistemas y modelamiento.",
  },
  {
    icono: "📐",
    nombre: "Geometría",
    descripcion: "Figuras, transformaciones, áreas y volúmenes.",
  },
  {
    icono: "📊",
    nombre: "Probabilidad y estadística",
    descripcion: "Datos, gráficos, medidas y probabilidades.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 to-indigo-400 text-2xl font-black text-slate-950">
              π
            </div>

            <div>
              <p className="text-xl font-black">PAESLab</p>
              <p className="text-xs text-slate-400">Matemática M1 y M2</p>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex">
            <a href="#entrenar" className="hover:text-teal-300">
              Entrenar
            </a>
            <a href="#videos" className="hover:text-teal-300">
              Videos
            </a>
            <a href="#clases" className="hover:text-teal-300">
              Clases online
            </a>
          </nav>

          <button className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold hover:border-teal-300 hover:text-teal-300">
            Iniciar sesión
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-teal-300/20 bg-teal-300/10 px-4 py-2 text-sm font-bold text-teal-200">
            Entrenamiento gratuito para la PAES
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-6xl">
            Mejora tu puntaje practicando{" "}
            <span className="bg-gradient-to-r from-teal-300 to-indigo-400 bg-clip-text text-transparent">
              pregunta a pregunta.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Entrena con ejercicios de Matemática M1 y M2, recibe explicaciones
            paso a paso y descubre qué contenidos necesitas reforzar.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#entrenar"
              className="rounded-2xl bg-teal-300 px-7 py-4 text-center font-black text-slate-950 transition hover:-translate-y-1"
            >
              Comenzar gratis →
            </a>

            <a
              href="#clases"
              className="rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-center font-black transition hover:-translate-y-1 hover:border-indigo-300"
            >
              Consultar por clases
            </a>
          </div>

          <div className="mt-9 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <p>✓ Preguntas originales M1 y M2</p>
            <p>✓ Explicaciones detalladas</p>
            <p>✓ Progreso guardado</p>
            <p>✓ Acceso gratuito</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Tu avance</p>
              <h2 className="mt-1 text-2xl font-black">Resumen semanal</h2>
            </div>

            <span className="rounded-xl bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-300">
              🔥 5 días
            </span>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-900/80 p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-slate-400">Precisión general</p>
                <p className="mt-1 text-4xl font-black text-teal-300">78%</p>
              </div>

              <p className="text-sm font-semibold text-emerald-300">
                +8% esta semana
              </p>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-teal-300 to-indigo-400" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Respondidas</p>
              <p className="mt-2 text-3xl font-black">124</p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Mejor racha</p>
              <p className="mt-2 text-3xl font-black">12</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-indigo-300/15 bg-indigo-400/10 p-5">
            <p className="text-sm font-bold text-indigo-200">
              Recomendación para hoy
            </p>
            <p className="mt-2 font-bold">
              Practica 10 preguntas de funciones.
            </p>
          </div>
        </div>
      </section>

      <section
        id="entrenar"
        className="relative z-10 border-y border-white/10 bg-white/[0.025] py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-bold uppercase tracking-[0.2em] text-teal-300">
            Entrenamiento
          </p>

          <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Elige el eje que quieres reforzar
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            Practica por contenido, dificultad y prueba. Cada respuesta tendrá
            retroalimentación y explicación.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {ejes.map((eje) => (
              <article
                key={eje.nombre}
                className="rounded-3xl border border-white/10 bg-white/[0.045] p-7 transition hover:-translate-y-1 hover:border-teal-300/40"
              >
                <div className="flex items-start gap-5">
                  <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-white/10 text-2xl">
                    {eje.icono}
                  </div>

                  <div>
                    <h3 className="text-xl font-black">{eje.nombre}</h3>
                    <p className="mt-2 leading-6 text-slate-400">
                      {eje.descripcion}
                    </p>
                    <button className="mt-5 font-bold text-teal-300">
                      Practicar eje →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="videos" className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-[2rem] border border-indigo-300/15 bg-gradient-to-br from-indigo-400/15 to-teal-300/5 p-8 sm:p-12">
          <p className="font-bold uppercase tracking-[0.2em] text-indigo-300">
            Próximamente
          </p>

          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Videos tutoriales por contenido
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-slate-300">
            Incorporaremos clases breves y explicaciones visuales vinculadas
            con los ejercicios que más te cuestan.
          </p>
        </div>
      </section>

      <section id="clases" className="relative z-10 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[2rem] bg-gradient-to-r from-teal-300 to-cyan-300 p-8 text-slate-950 sm:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="font-bold uppercase tracking-[0.2em]">
                  Apoyo personalizado
                </p>

                <h2 className="mt-3 text-3xl font-black sm:text-5xl">
                  ¿Necesitas ayuda para mejorar tu puntaje?
                </h2>

                <p className="mt-4 max-w-2xl text-lg font-medium leading-8">
                  Consulta por clases online individuales, enfocadas en los
                  contenidos que necesitas reforzar.
                </p>
              </div>

              <a
                href="mailto:guhidalgo@gmail.com?subject=Consulta%20por%20clases%20PAES"
                className="rounded-2xl bg-slate-950 px-7 py-4 text-center font-black text-white transition hover:-translate-y-1"
              >
                Tomar contacto
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>© 2026 PAESLab. Entrenamiento gratuito de Matemática.</p>
          <p>M1 · M2 · Clases online · Videos tutoriales</p>
        </div>
      </footer>
    </main>
  );
}
