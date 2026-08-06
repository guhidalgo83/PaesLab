"use client";

import Link from "next/link";

type LearningHeaderProps = {
  title?: string;
  subtitle?: string;
  showRoute?: boolean;
};

export default function LearningHeader({
  title = "MathLabs Aprender",
  subtitle = "Comprende, practica y consolida",
  showRoute = true,
}: LearningHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-300 to-indigo-400 text-xl font-black text-slate-950">π</span>
        <span>
          <strong className="block text-xl">{title}</strong>
          <small className="text-slate-400">{subtitle}</small>
        </span>
      </Link>

      <nav className="flex flex-wrap gap-3">
        <Link href="/matematica" className="rounded-xl border border-teal-300/30 px-4 py-2 text-sm font-black text-teal-200">Escolar</Link>
        <Link href="/aprender" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold">Contenidos PAES</Link>
        <Link href="/mi-plan" className="rounded-xl border border-amber-300/40 px-4 py-2 text-sm font-black text-amber-200">Mi plan</Link>
        {showRoute && <Link href="/ruta-estudio" className="rounded-xl border border-indigo-300/40 px-4 py-2 text-sm font-black text-indigo-200">Mi ruta</Link>}
        <Link href="/entrenar" className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-black text-slate-950">Practicar</Link>
      </nav>
    </header>
  );
}
