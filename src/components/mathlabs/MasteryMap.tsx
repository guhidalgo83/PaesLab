"use client";

import Link from "next/link";
import type { HubAxis, HubPriorityTopic } from "@/types/learning-os";

function statusColor(value: number) {
  if (value >= 80) return "bg-emerald-300";
  if (value >= 50) return "bg-amber-300";
  if (value > 0) return "bg-orange-300";
  return "bg-slate-700";
}

export default function MasteryMap({
  axes,
  topics,
}: {
  axes: HubAxis[];
  topics: HubPriorityTopic[];
}) {
  return (
    <section className="rounded-[2.25rem] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-200">Mapa curricular</p>
          <h2 className="mt-2 text-2xl font-black text-white">Cómo vas por eje</h2>
        </div>
        <Link href="/progreso/5-basico" className="text-sm font-black text-cyan-200">Ver mapa completo →</Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {axes.map((axis) => (
          <article key={axis.axis_id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl">{axis.axis_icon}</p>
                <h3 className="mt-2 font-black text-white">{axis.axis_name}</h3>
                <p className="mt-1 text-xs text-slate-500">{axis.mastered_topics}/{axis.total_topics} temas dominados</p>
              </div>
              <p className="text-2xl font-black text-teal-200">{axis.mastery_percent}%</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-teal-300" style={{ width: `${axis.mastery_percent}%` }} />
            </div>
          </article>
        ))}
      </div>

      {topics.length > 0 ? (
        <div className="mt-7">
          <p className="text-sm font-black text-slate-300">Temas prioritarios</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.slice(0, 6).map((topic) => (
              <Link
                key={topic.topic_id}
                href={`/matematica/tema/${topic.topic_slug}`}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm font-bold text-slate-300 transition hover:border-cyan-300/30"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${statusColor(topic.mastery_percent)}`} />
                {topic.topic_title}
                <span className="text-slate-600">{topic.mastery_percent}%</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
