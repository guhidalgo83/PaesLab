"use client";

type VisualType =
  | "none"
  | "function_graph"
  | "bar_chart"
  | "table"
  | "triangle"
  | "image";

type QuestionVisualProps = {
  visualType?: VisualType | string | null;
  visualData?: Record<string, unknown> | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  compact?: boolean;
};

function numberValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function numberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map(Number).filter(Number.isFinite)
    : [];
}

function FunctionGraph({ data }: { data: Record<string, unknown> }) {
  const kind = data.kind === "quadratic" ? "quadratic" : "linear";
  const a = numberValue(data.a, 1);
  const b = numberValue(data.b, 0);
  const c = numberValue(data.c, 0);
  const xMin = numberValue(data.xMin, -5);
  const xMax = numberValue(data.xMax, 5);
  const yMin = numberValue(data.yMin, -5);
  const yMax = numberValue(data.yMax, 5);
  const width = 720;
  const height = 390;
  const padding = 48;

  const scaleX = (x: number) =>
    padding + ((x - xMin) / (xMax - xMin)) * (width - padding * 2);
  const scaleY = (y: number) =>
    height - padding - ((y - yMin) / (yMax - yMin)) * (height - padding * 2);

  const values = Array.from({ length: 121 }, (_, index) => {
    const x = xMin + ((xMax - xMin) * index) / 120;
    const y = kind === "quadratic" ? a * x * x + b * x + c : a * x + b;
    return { x, y };
  }).filter(({ y }) => Number.isFinite(y));

  const path = values
    .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${scaleX(x)} ${scaleY(y)}`)
    .join(" ");

  const xTicks = Array.from(
    { length: Math.min(11, Math.floor(xMax - xMin) + 1) },
    (_, index) => Math.round(xMin + ((xMax - xMin) * index) / Math.min(10, Math.max(1, Math.floor(xMax - xMin)))),
  );
  const yTicks = Array.from(
    { length: Math.min(11, Math.floor(yMax - yMin) + 1) },
    (_, index) => Math.round(yMin + ((yMax - yMin) * index) / Math.min(10, Math.max(1, Math.floor(yMax - yMin)))),
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={String(data.alt ?? "Gráfico de una función en el plano cartesiano")}
      className="h-auto w-full"
    >
      <rect width={width} height={height} rx="22" fill="#0f172a" />

      {xTicks.map((tick) => (
        <g key={`x-${tick}`}>
          <line
            x1={scaleX(tick)}
            y1={padding}
            x2={scaleX(tick)}
            y2={height - padding}
            stroke="#334155"
            strokeWidth="1"
          />
          <text
            x={scaleX(tick)}
            y={height - padding + 22}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="14"
          >
            {tick}
          </text>
        </g>
      ))}

      {yTicks.map((tick) => (
        <g key={`y-${tick}`}>
          <line
            x1={padding}
            y1={scaleY(tick)}
            x2={width - padding}
            y2={scaleY(tick)}
            stroke="#334155"
            strokeWidth="1"
          />
          <text
            x={padding - 12}
            y={scaleY(tick) + 5}
            textAnchor="end"
            fill="#94a3b8"
            fontSize="14"
          >
            {tick}
          </text>
        </g>
      ))}

      {yMin <= 0 && yMax >= 0 && (
        <line
          x1={padding}
          y1={scaleY(0)}
          x2={width - padding}
          y2={scaleY(0)}
          stroke="#cbd5e1"
          strokeWidth="2"
        />
      )}
      {xMin <= 0 && xMax >= 0 && (
        <line
          x1={scaleX(0)}
          y1={padding}
          x2={scaleX(0)}
          y2={height - padding}
          stroke="#cbd5e1"
          strokeWidth="2"
        />
      )}

      <path d={path} fill="none" stroke="#5eead4" strokeWidth="5" strokeLinecap="round" />
      <text x={width - 35} y={scaleY(0) - 10} fill="#e2e8f0" fontSize="16">x</text>
      <text x={scaleX(0) + 12} y={28} fill="#e2e8f0" fontSize="16">y</text>
    </svg>
  );
}

function BarChart({ data }: { data: Record<string, unknown> }) {
  const labels = stringArray(data.labels);
  const values = numberArray(data.values);
  const usable = labels.slice(0, values.length);
  const width = 720;
  const height = 390;
  const padding = 55;
  const maxValue = Math.max(numberValue(data.yMax, 0), ...values, 1);
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const slot = chartWidth / Math.max(usable.length, 1);
  const barWidth = Math.min(80, slot * 0.62);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={String(data.alt ?? "Gráfico de barras")}
      className="h-auto w-full"
    >
      <rect width={width} height={height} rx="22" fill="#0f172a" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="2" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="2" />

      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const y = height - padding - chartHeight * fraction;
        const value = Math.round(maxValue * fraction);
        return (
          <g key={fraction}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#334155" />
            <text x={padding - 12} y={y + 5} textAnchor="end" fill="#94a3b8" fontSize="14">{value}</text>
          </g>
        );
      })}

      {usable.map((label, index) => {
        const value = values[index] ?? 0;
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + slot * index + (slot - barWidth) / 2;
        const y = height - padding - barHeight;
        return (
          <g key={`${label}-${index}`}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="8" fill={index % 2 ? "#818cf8" : "#5eead4"} />
            <text x={x + barWidth / 2} y={y - 10} textAnchor="middle" fill="#f8fafc" fontSize="15" fontWeight="700">{value}</text>
            <text x={x + barWidth / 2} y={height - padding + 24} textAnchor="middle" fill="#cbd5e1" fontSize="14">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DataTable({ data }: { data: Record<string, unknown> }) {
  const headers = stringArray(data.headers);
  const rows = Array.isArray(data.rows)
    ? data.rows.map((row) => (Array.isArray(row) ? row.map(String) : []))
    : [];

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/70">
      <table className="w-full min-w-[480px] border-collapse text-left">
        <thead className="bg-teal-300/10 text-teal-200">
          <tr>
            {headers.map((header, index) => (
              <th key={`${header}-${index}`} className="border-b border-white/10 px-4 py-3 font-black">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-white/10 last:border-0">
              {headers.map((_, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-slate-200">{row[cellIndex] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Triangle({ data }: { data: Record<string, unknown> }) {
  const sideA = String(data.sideA ?? "a");
  const sideB = String(data.sideB ?? "b");
  const sideC = String(data.sideC ?? "c");
  const rightAngle = data.rightAngle !== false;
  const width = 720;
  const height = 390;
  const p1 = { x: 135, y: 320 };
  const p2 = { x: 590, y: 320 };
  const p3 = { x: 135, y: 65 };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={String(data.alt ?? "Diagrama de un triángulo")}
      className="h-auto w-full"
    >
      <rect width={width} height={height} rx="22" fill="#0f172a" />
      <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} fill="#5eead422" stroke="#5eead4" strokeWidth="5" strokeLinejoin="round" />
      {rightAngle && (
        <path d={`M ${p1.x} ${p1.y - 36} L ${p1.x + 36} ${p1.y - 36} L ${p1.x + 36} ${p1.y}`} fill="none" stroke="#f8fafc" strokeWidth="3" />
      )}
      <text x={(p1.x + p2.x) / 2} y={p1.y + 34} textAnchor="middle" fill="#f8fafc" fontSize="22" fontWeight="800">{sideA}</text>
      <text x={p1.x - 28} y={(p1.y + p3.y) / 2} textAnchor="middle" fill="#f8fafc" fontSize="22" fontWeight="800">{sideB}</text>
      <text x={(p2.x + p3.x) / 2 + 20} y={(p2.y + p3.y) / 2 - 16} textAnchor="middle" fill="#f8fafc" fontSize="22" fontWeight="800">{sideC}</text>
    </svg>
  );
}

export default function QuestionVisual({
  visualType = "none",
  visualData = {},
  imageUrl,
  imageAlt,
  compact = false,
}: QuestionVisualProps) {
  if (!visualType || visualType === "none") return null;

  return (
    <figure className={`mx-auto mt-7 w-full ${compact ? "max-w-xl" : "max-w-3xl"}`}>
      {visualType === "function_graph" && <FunctionGraph data={visualData ?? {}} />}
      {visualType === "bar_chart" && <BarChart data={visualData ?? {}} />}
      {visualType === "table" && <DataTable data={visualData ?? {}} />}
      {visualType === "triangle" && <Triangle data={visualData ?? {}} />}
      {visualType === "image" && imageUrl && (
        <img
          src={imageUrl}
          alt={imageAlt || "Recurso visual de la pregunta"}
          className="mx-auto max-h-[520px] w-auto max-w-full rounded-2xl border border-white/10 bg-white object-contain"
        />
      )}
      {imageAlt && visualType !== "image" && (
        <figcaption className="mt-3 text-center text-sm text-slate-400">{imageAlt}</figcaption>
      )}
    </figure>
  );
}
