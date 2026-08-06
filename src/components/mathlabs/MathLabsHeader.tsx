import Link from "next/link";

type MathLabsHeaderProps = {
  compact?: boolean;
};

export default function MathLabsHeader({ compact = false }: MathLabsHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 to-indigo-400 text-xl font-black text-slate-950">
            π
          </span>
          <span>
            <strong className="block text-xl font-black text-white">MathLabs</strong>
            {!compact && <small className="text-slate-400">Matemática personalizada</small>}
          </span>
        </Link>

        <nav className="flex flex-wrap gap-2 text-sm font-bold">
          <Link href="/matematica" className="rounded-xl border border-teal-300/30 px-4 py-2 text-teal-200">
            Cursos
          </Link>
          <Link href="/diagnostico-escolar" className="rounded-xl border border-violet-300/30 px-4 py-2 text-violet-200">
            Diagnóstico
          </Link>
          <Link href="/mi-ruta" className="rounded-xl border border-amber-300/30 px-4 py-2 text-amber-200">
            Mi ruta
          </Link>
          <Link href="/mi-colegio" className="rounded-xl border border-sky-300/30 px-4 py-2 text-sky-200">
            Mi colegio
          </Link>
          <Link href="/paes" className="rounded-xl border border-indigo-300/30 px-4 py-2 text-indigo-200">
            PAES
          </Link>
          <Link href="/dashboard" className="rounded-xl bg-white px-4 py-2 text-slate-950">
            Mi panel
          </Link>
        </nav>
      </div>
    </header>
  );
}
