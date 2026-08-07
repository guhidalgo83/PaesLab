"use client";

import type { LearningTrendPoint } from "@/types/learning-os";

export default function LearningTrendChart({ points }: { points: LearningTrendPoint[] }) {
  if (points.length === 0) {
    return <p className="rounded-2xl bg-white/[0.03] p-5 text-sm text-slate-500">Todavía no hay suficientes semanas de actividad para mostrar una tendencia.</p>;
  }

  const maxScore = 100;
  const width = 620;
  const height = 220;
  const padding = 28;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const denominator = Math.max(1, points.length - 1);
  const coords = points.map((point, index) => ({
    x: padding + (usableWidth * index) / denominator,
    y: padding + usableHeight - (point.average_score / maxScore) * usableHeight,
  }));
  const polyline = coords.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px] rounded-3xl border border-white/10 bg-slate-950/40">
        {[0, 25, 50, 75, 100].map((value) => {
          const y = padding + usableHeight - (value / 100) * usableHeight;
          return (
            <g key={value}>
              <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />
              <text x={5} y={y + 4} fill="#64748b" fontSize="10">{value}</text>
            </g>
          );
        })}
        <polyline points={polyline} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((coord, index) => (
          <g key={points[index].week_start}>
            <circle cx={coord.x} cy={coord.y} r="5" fill="#2dd4bf" />
            <text x={coord.x} y={height - 8} textAnchor="middle" fill="#64748b" fontSize="9">
              {new Date(points[index].week_start).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" })}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
