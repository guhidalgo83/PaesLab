"use client";

import Link from "next/link";
import type { KnowledgeTopic } from "@/types/school";
import type { StudyRecommendation } from "@/types/diagnostic";

type Props = {
  recommendation: StudyRecommendation;
  topic: KnowledgeTopic | null;
  busy?: boolean;
  onStatusChange: (
    id: string,
    status: "in_progress" | "completed" | "dismissed",
  ) => void;
};

export default function StudyRecommendationCard({
  recommendation,
  topic,
  busy = false,
  onStatusChange,
}: Props) {
  const priorityColor =
    recommendation.priority >= 5
      ? "text-rose-200 bg-rose-300/10"
      : recommendation.priority >= 4
        ? "text-amber-200 bg-amber-300/10"
        : "text-indigo-200 bg-indigo-300/10";

  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={`rounded-lg px-3 py-1 text-xs font-black ${priorityColor}`}>
            Prioridad {recommendation.priority}
          </span>
          <h3 className="mt-4 text-xl font-black">
            {topic?.title ?? "Contenido recomendado"}
          </h3>
        </div>
        {recommendation.due_date && (
          <time className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-slate-400">
            Sugerido: {recommendation.due_date}
          </time>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-400">
        {recommendation.reason}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {topic && (
          <Link
            href={`/matematica/tema/${topic.slug}`}
            className="rounded-xl bg-teal-300 px-4 py-2 text-sm font-black text-slate-950"
          >
            Revisar materiales
          </Link>
        )}
        {recommendation.status === "pending" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatusChange(recommendation.id, "in_progress")}
            className="rounded-xl border border-indigo-300/30 px-4 py-2 text-sm font-black text-indigo-200 disabled:opacity-40"
          >
            Comenzar
          </button>
        )}
        {recommendation.status === "in_progress" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatusChange(recommendation.id, "completed")}
            className="rounded-xl border border-emerald-300/30 px-4 py-2 text-sm font-black text-emerald-200 disabled:opacity-40"
          >
            Marcar completado
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onStatusChange(recommendation.id, "dismissed")}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-400 disabled:opacity-40"
        >
          Ocultar
        </button>
      </div>
    </article>
  );
}
