import Link from "next/link";
import type { CurriculumObjective, KnowledgeTopic } from "@/types/school";

type Props = {
  objective: CurriculumObjective;
  topic?: KnowledgeTopic;
  mastery?: number;
};

function masteryLabel(value: number) {
  if (value >= 75) return "Dominado";
  if (value >= 40) return "En desarrollo";
  if (value > 0) return "Requiere refuerzo";
  return "No iniciado";
}

export default function CurriculumObjectiveCard({ objective, topic, mastery = 0 }: Props) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-teal-300">{objective.code}</p>
          <h3 className="mt-2 text-lg font-black text-white">{objective.title}</h3>
        </div>
        <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
          {masteryLabel(mastery)}
        </span>
      </div>

      <p className="mt-3 leading-7 text-slate-400">{objective.summary}</p>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-teal-300 to-indigo-400" style={{ width: `${mastery}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{topic?.content_status === "published" ? "Contenido disponible" : "Mapa curricular cargado"}</span>
        <span>{mastery}%</span>
      </div>

      {topic && (
        <Link
          href={`/matematica/tema/${topic.slug}`}
          className="mt-5 inline-block rounded-xl border border-white/15 px-4 py-2 text-sm font-black text-slate-200"
        >
          Revisar tema →
        </Link>
      )}
    </article>
  );
}
