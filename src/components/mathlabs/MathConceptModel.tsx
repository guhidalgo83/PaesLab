"use client";

import type { ReactNode } from "react";

type ModelData = Record<string, unknown>;

type Point = { x: number; y: number; label?: string };

type BarItem = { label: string; value: number; color?: string };

type LineItem = { label: string; value: number };

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Math.round(asNumber(value, fallback));
  return Math.max(min, Math.min(max, parsed));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asPointArray(value: unknown): Point[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<Point[]>((items, item) => {
    if (!item || typeof item !== "object") return items;

    const candidate = item as Record<string, unknown>;
    const label = asString(candidate.label);

    items.push({
      x: asNumber(candidate.x, 0),
      y: asNumber(candidate.y, 0),
      ...(label ? { label } : {}),
    });

    return items;
  }, []);
}

function asBarItems(value: unknown): BarItem[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<BarItem[]>((items, item) => {
    if (!item || typeof item !== "object") return items;

    const candidate = item as Record<string, unknown>;
    const color = asString(candidate.color);

    items.push({
      label: asString(candidate.label),
      value: asNumber(candidate.value, 0),
      ...(color ? { color } : {}),
    });

    return items;
  }, []);
}

function asLineItems(value: unknown): LineItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Record<string, unknown>;
      return {
        label: asString(candidate.label),
        value: asNumber(candidate.value, 0),
      };
    })
    .filter((item): item is LineItem => item !== null);
}

function palette(index: number) {
  const colors = [
    "bg-teal-300 text-slate-950",
    "bg-indigo-300 text-slate-950",
    "bg-amber-300 text-slate-950",
    "bg-rose-300 text-slate-950",
    "bg-emerald-300 text-slate-950",
  ];
  return colors[index % colors.length];
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5 sm:p-6">{children}</div>;
}

function FractionBar({ numerator, denominator, label }: { numerator: number; denominator: number; label?: string }) {
  const safeDenominator = Math.max(1, Math.min(20, denominator));
  const safeNumerator = Math.max(0, Math.min(40, numerator));
  const parts = Array.from({ length: safeNumerator > safeDenominator ? safeDenominator : safeDenominator }, (_, index) => index);
  return (
    <div>
      {label ? <p className="mb-3 text-center text-sm font-black text-slate-300">{label}</p> : null}
      <div className="grid gap-3">
        {Array.from({ length: Math.max(1, Math.ceil(safeNumerator / safeDenominator)) }, (_, wholeIndex) => {
          const filledInThisRow = Math.max(0, Math.min(safeDenominator, safeNumerator - wholeIndex * safeDenominator));
          return (
            <div key={wholeIndex} className="grid overflow-hidden rounded-xl border border-white/15" style={{ gridTemplateColumns: `repeat(${safeDenominator}, minmax(0, 1fr))` }}>
              {parts.map((index) => (
                <div key={`${wholeIndex}-${index}`} className={`h-10 border-r border-slate-950/40 last:border-r-0 ${index < filledInThisRow ? "bg-teal-300" : "bg-slate-800"}`} />
              ))}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center font-mono text-lg font-black text-teal-200">{numerator}/{denominator}</p>
    </div>
  );
}

function PlaceValueModel({ value }: { value: string }) {
  const digits = value.replace(/\s/g, "").split("");
  const groups: Array<{ title: string; values: string[] }> = [];
  const reversed = [...digits].reverse();
  const titles = ["Unidades", "Miles", "Millones"];
  for (let groupIndex = 0; groupIndex < titles.length; groupIndex += 1) {
    const slice = reversed.slice(groupIndex * 3, groupIndex * 3 + 3).reverse();
    if (slice.length > 0) {
      groups.unshift({ title: titles[groupIndex], values: slice });
    }
  }
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {groups.map((group) => (
        <Panel key={group.title}>
          <p className="text-center text-sm font-black uppercase tracking-wide text-slate-400">{group.title}</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {group.values.map((digit, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{["Centenas", "Decenas", "Unidades"][3 - group.values.length + index] ?? "Valor"}</p>
                <p className="mt-2 text-3xl font-black text-teal-200">{digit}</p>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

function MultiplicationArray({ rows, cols }: { rows: number; cols: number }) {
  const safeRows = Math.max(1, Math.min(15, rows));
  const safeCols = Math.max(1, Math.min(15, cols));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3 text-center text-lg font-black text-white">
        <span>{safeRows}</span>
        <span className="text-amber-200">×</span>
        <span>{safeCols}</span>
        <span className="text-slate-500">=</span>
        <span className="text-teal-200">{safeRows * safeCols}</span>
      </div>
      <div className="grid justify-center gap-1" style={{ gridTemplateColumns: `repeat(${safeCols}, 1.2rem)` }}>
        {Array.from({ length: safeRows * safeCols }, (_, index) => (
          <div key={index} className="h-5 w-5 rounded-sm bg-teal-300" />
        ))}
      </div>
    </div>
  );
}

function DivisionGroups({ total, groupSize }: { total: number; groupSize: number }) {
  const safeTotal = Math.max(1, Math.min(60, total));
  const safeGroup = Math.max(1, Math.min(12, groupSize));
  const groups = Math.ceil(safeTotal / safeGroup);
  return (
    <div className="space-y-4">
      <p className="text-center text-lg font-black text-white">
        {safeTotal} ÷ {safeGroup} = <span className="text-teal-200">{Math.floor(safeTotal / safeGroup)}</span>
        {safeTotal % safeGroup > 0 ? <span className="text-slate-400"> y sobra {safeTotal % safeGroup}</span> : null}
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: groups }, (_, groupIndex) => {
          const items = Math.max(0, Math.min(safeGroup, safeTotal - groupIndex * safeGroup));
          return (
            <Panel key={groupIndex}>
              <p className="text-center text-sm font-black text-indigo-200">Grupo {groupIndex + 1}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {Array.from({ length: items }, (_, itemIndex) => (
                  <span key={itemIndex} className="grid h-7 w-7 place-items-center rounded-full bg-indigo-300 text-xs font-black text-slate-950">●</span>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function RulerModel({ start, end, step, highlight }: { start: number; end: number; step: number; highlight?: number }) {
  const points: number[] = [];
  for (let current = start; current <= end; current += step) points.push(current);
  return (
    <div className="space-y-4">
      <div className="relative mt-8 h-12 rounded-full bg-white/5 px-6">
        <div className="absolute left-6 right-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15" />
        <div className="relative flex h-full items-center justify-between">
          {points.map((value) => (
            <div key={value} className="relative flex flex-col items-center">
              <div className={`h-6 w-0.5 ${value === highlight ? "bg-amber-300" : "bg-white/40"}`} />
              <p className={`mt-2 text-xs font-black ${value === highlight ? "text-amber-200" : "text-slate-400"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>
      {highlight !== undefined ? <p className="text-center text-sm text-slate-300">La marca destacada está en <span className="font-black text-white">{highlight}</span>.</p> : null}
    </div>
  );
}

function ConversionLadder({ from, to, factor }: { from: string; to: string; factor: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
      <Panel>
        <p className="text-sm font-black uppercase tracking-wide text-slate-400">Unidad inicial</p>
        <p className="mt-3 text-4xl font-black text-white">{from}</p>
      </Panel>
      <div className="rounded-full bg-amber-300/15 px-4 py-3 text-center font-black text-amber-200">× {factor}</div>
      <Panel>
        <p className="text-sm font-black uppercase tracking-wide text-slate-400">Unidad de llegada</p>
        <p className="mt-3 text-4xl font-black text-teal-200">{to}</p>
      </Panel>
    </div>
  );
}

function DecimalPlaceValue({ value }: { value: string }) {
  const normalized = value.replace(".", ",");
  const [whole = "0", decimals = ""] = normalized.split(",");
  const digits = decimals.padEnd(3, "0").slice(0, 3);
  const cells = [
    { title: "Unidades", value: whole },
    { title: "Décimos", value: digits[0] },
    { title: "Centésimos", value: digits[1] },
    { title: "Milésimos", value: digits[2] },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {cells.map((cell, index) => (
        <div key={cell.title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{cell.title}</p>
          <p className={`mt-3 text-4xl font-black ${index === 0 ? "text-white" : "text-teal-200"}`}>{cell.value}</p>
        </div>
      ))}
    </div>
  );
}

function DecimalCompare({ left, right }: { left: string; right: string }) {
  const l = Number(left.replace(",", "."));
  const r = Number(right.replace(",", "."));
  const symbol = l > r ? ">" : l < r ? "<" : "=";
  return (
    <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
      <Panel><p className="text-center text-5xl font-black text-white">{left}</p></Panel>
      <div className="text-center text-5xl font-black text-amber-200">{symbol}</div>
      <Panel><p className="text-center text-5xl font-black text-teal-200">{right}</p></Panel>
    </div>
  );
}

function PatternTable({ start, step, rows }: { start: number; step: number; rows: number }) {
  const safeRows = Math.max(3, Math.min(8, rows));
  const list = Array.from({ length: safeRows }, (_, index) => ({ figure: index + 1, value: start + index * step }));
  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
      <Panel>
        <p className="text-sm font-black uppercase tracking-wide text-slate-400">Tabla del patrón</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-white/[0.05] text-slate-400">
              <tr><th className="px-4 py-3">Figura</th><th className="px-4 py-3">Cantidad</th></tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.figure} className="border-t border-white/10"><td className="px-4 py-3">{row.figure}</td><td className="px-4 py-3 font-black text-white">{row.value}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel>
        <p className="text-sm font-black uppercase tracking-wide text-slate-400">Regla</p>
        <p className="mt-4 text-lg leading-8 text-slate-200">Cada figura aumenta en <span className="font-black text-amber-200">{step}</span>.</p>
        <p className="mt-3 text-lg leading-8 text-slate-200">Si la figura es <span className="font-black text-teal-200">n</span>, la cantidad es <span className="font-mono font-black text-white">{step}·n {start - step >= 0 ? `+ ${start - step}` : `- ${Math.abs(start - step)}`}</span>.</p>
      </Panel>
    </div>
  );
}

function CoordinatePlane({ points }: { points: Point[] }) {
  const safePoints = points.slice(0, 5);
  const toX = (x: number) => 12 + x * 8;
  const toY = (y: number) => 88 - y * 8;
  return (
    <svg viewBox="0 0 100 100" className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/45 p-3">
      {Array.from({ length: 11 }, (_, i) => (
        <g key={i}>
          <line x1={10} y1={10 + i * 8} x2={90} y2={10 + i * 8} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <line x1={10 + i * 8} y1={10} x2={10 + i * 8} y2={90} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        </g>
      ))}
      <line x1={10} y1={90} x2={90} y2={90} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <line x1={10} y1={90} x2={10} y2={10} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      {safePoints.map((point, index) => (
        <g key={`${point.label ?? index}-${index}`}>
          <circle cx={toX(point.x)} cy={toY(point.y)} r={2.6} fill="#2dd4bf" />
          <text x={toX(point.x) + 2.5} y={toY(point.y) - 2.5} fontSize="4" fill="#ffffff">{point.label ?? `P${index + 1}`}</text>
        </g>
      ))}
    </svg>
  );
}

function BarsModel({ items }: { items: BarItem[] }) {
  const safeItems = items.slice(0, 5);
  const maxValue = Math.max(1, ...safeItems.map((item) => item.value));
  return (
    <div className="grid gap-4 md:grid-cols-5 md:items-end">
      {safeItems.map((item, index) => {
        const height = Math.max(18, (item.value / maxValue) * 180);
        return (
          <div key={`${item.label}-${index}`} className="flex flex-col items-center gap-3">
            <div className="flex h-52 w-full items-end justify-center rounded-3xl border border-white/10 bg-slate-950/45 p-3">
              <div className={`w-full rounded-2xl ${palette(index)}`} style={{ height }}>
                <div className="flex h-full items-start justify-center pt-3 text-sm font-black">{item.value}</div>
              </div>
            </div>
            <p className="text-center text-sm font-black text-slate-300">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function LineGraphModel({ items }: { items: LineItem[] }) {
  const safeItems = items.slice(0, 6);
  const maxValue = Math.max(1, ...safeItems.map((item) => item.value));
  const points = safeItems.map((item, index) => `${15 + index * (70 / Math.max(1, safeItems.length - 1))},${85 - (item.value / maxValue) * 60}`).join(" ");
  return (
    <div className="space-y-4">
      <svg viewBox="0 0 100 100" className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950/45 p-3">
        {Array.from({ length: 6 }, (_, i) => <line key={i} x1={12} y1={15 + i * 12} x2={90} y2={15 + i * 12} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />)}
        <polyline fill="none" stroke="#2dd4bf" strokeWidth="2" points={points} />
        {safeItems.map((item, index) => {
          const x = 15 + index * (70 / Math.max(1, safeItems.length - 1));
          const y = 85 - (item.value / maxValue) * 60;
          return (
            <g key={`${item.label}-${index}`}>
              <circle cx={x} cy={y} r={2.3} fill="#fbbf24" />
              <text x={x} y={94} textAnchor="middle" fontSize="4" fill="#cbd5e1">{item.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="grid gap-3 sm:grid-cols-3">
        {safeItems.map((item, index) => (
          <div key={`${item.label}-card-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MathConceptModel({ data }: { data: ModelData }) {
  const mode = asString(data.mode, "fraction_bar");
  const caption = asString(data.caption);

  let content: ReactNode = null;

  if (mode === "place_value") {
    content = <PlaceValueModel value={asString(data.value, "245901")} />;
  } else if (mode === "multiplication_array") {
    content = <MultiplicationArray rows={asInteger(data.rows, 4, 1, 15)} cols={asInteger(data.cols, 6, 1, 15)} />;
  } else if (mode === "division_groups") {
    content = <DivisionGroups total={asInteger(data.total, 24, 1, 60)} groupSize={asInteger(data.group_size, 6, 1, 12)} />;
  } else if (mode === "ruler") {
    content = <RulerModel start={asInteger(data.start, 0, 0, 200)} end={asInteger(data.end, 10, 1, 200)} step={asInteger(data.step, 1, 1, 20)} highlight={asInteger(data.highlight, 6, 0, 200)} />;
  } else if (mode === "conversion_ladder") {
    content = <ConversionLadder from={asString(data.from, "km")} to={asString(data.to, "m")} factor={asInteger(data.factor, 1000, 1, 1000)} />;
  } else if (mode === "fraction_bar") {
    content = <FractionBar numerator={asInteger(data.numerator, 3, 0, 40)} denominator={asInteger(data.denominator, 4, 1, 20)} />;
  } else if (mode === "fraction_equivalence") {
    const numerator = asInteger(data.numerator, 2, 0, 20);
    const denominator = asInteger(data.denominator, 3, 1, 20);
    const multiplier = asInteger(data.multiplier, 2, 1, 6);
    content = (
      <div className="grid gap-6 md:grid-cols-2 md:items-center">
        <FractionBar numerator={numerator} denominator={denominator} label="Fracción inicial" />
        <FractionBar numerator={numerator * multiplier} denominator={denominator * multiplier} label="Fracción equivalente" />
      </div>
    );
  } else if (mode === "mixed_number") {
    const wholes = asInteger(data.wholes, 1, 0, 4);
    const numerator = asInteger(data.numerator, 2, 0, 20);
    const denominator = asInteger(data.denominator, 3, 1, 20);
    content = (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: wholes }, (_, index) => <FractionBar key={index} numerator={denominator} denominator={denominator} label={`Unidad ${index + 1}`} />)}
          <FractionBar numerator={numerator} denominator={denominator} label="Parte extra" />
        </div>
        <p className="text-center text-lg font-black text-white">Número mixto: <span className="text-teal-200">{wholes} {numerator}/{denominator}</span></p>
      </div>
    );
  } else if (mode === "decimal_place_value") {
    content = <DecimalPlaceValue value={asString(data.value, "3,482")} />;
  } else if (mode === "decimal_compare") {
    content = <DecimalCompare left={asString(data.left, "2,35")} right={asString(data.right, "2,305")} />;
  } else if (mode === "pattern_table") {
    content = <PatternTable start={asInteger(data.start, 4, -50, 200)} step={asInteger(data.step, 3, -20, 40)} rows={asInteger(data.rows, 6, 3, 8)} />;
  } else if (mode === "coordinate_plane") {
    content = <CoordinatePlane points={asPointArray(data.points)} />;
  } else if (mode === "bar_graph") {
    content = <BarsModel items={asBarItems(data.items)} />;
  } else if (mode === "line_graph") {
    content = <LineGraphModel items={asLineItems(data.items)} />;
  } else {
    content = <FractionBar numerator={asInteger(data.numerator, 1, 0, 20)} denominator={asInteger(data.denominator, 2, 1, 20)} />;
  }

  return (
    <div className="rounded-[2rem] border border-teal-300/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-[0_10px_40px_rgba(20,184,166,0.08)] sm:p-6">
      {content}
      {caption ? <p className="mt-5 text-center text-sm leading-6 text-slate-400">{caption}</p> : null}
    </div>
  );
}
