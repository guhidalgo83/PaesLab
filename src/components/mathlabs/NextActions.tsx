"use client";

import Link from "next/link";
import type { HubAction } from "@/types/learning-os";

export default function NextActions({ actions }: { actions: HubAction[] }) {
  if (actions.length === 0) {
    return (
      <section className="rounded-[2.25rem] border border-emerald-300/20 bg-emerald-300/[0.05] p-6">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-3 text-2xl font-black text-white">No hay urgencias pendientes</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">Puedes explorar un laboratorio, repasar una unidad o elegir libremente un tema.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[2.25rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_32%),rgba(255,255,255,0.025)] p-6 sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Ruta sugerida</p>
      <h2 className="mt-2 text-2xl font-black text-white">Qué haría hoy</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">MathLabs prioriza brechas, repasos y actividades que todavía no completas.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {actions.slice(0, 3).map((action, index) => (
          <Link
            key={`${action.action_type}-${action.href}-${index}`}
            href={action.href}
            className="group rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5 transition hover:-translate-y-1 hover:border-cyan-300/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-4xl">{action.emoji}</span>
              <span className="rounded-xl bg-white/5 px-3 py-1 text-xs font-black text-slate-500">Paso {index + 1}</span>
            </div>
            <h3 className="mt-4 text-lg font-black text-white">{action.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{action.description}</p>
            <p className="mt-4 font-black text-cyan-200">Comenzar →</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
