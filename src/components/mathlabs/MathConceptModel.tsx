"use client";

type ModelData = Record<string, unknown>;

function asInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function FractionBar({
  numerator,
  denominator,
  label,
}: {
  numerator: number;
  denominator: number;
  label?: string;
}) {
  const safeDenominator = Math.max(1, Math.min(20, denominator));
  const safeNumerator = Math.max(0, Math.min(safeDenominator, numerator));

  return (
    <div>
      {label && <p className="mb-2 text-center text-sm font-black text-slate-300">{label}</p>}
      <div
        className="grid overflow-hidden rounded-xl border border-white/20"
        style={{ gridTemplateColumns: `repeat(${safeDenominator}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: safeDenominator }, (_, index) => (
          <div
            key={index}
            className={`h-12 border-r border-slate-950/40 last:border-r-0 ${
              index < safeNumerator ? "bg-teal-300" : "bg-slate-800"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-center font-mono text-lg font-black text-teal-200">
        {safeNumerator}/{safeDenominator}
      </p>
    </div>
  );
}

function DecimalGrid({ hundredths }: { hundredths: number }) {
  const shaded = Math.max(0, Math.min(100, hundredths));
  return (
    <div className="mx-auto grid w-full max-w-[320px] grid-cols-10 overflow-hidden rounded-xl border border-white/20">
      {Array.from({ length: 100 }, (_, index) => (
        <div
          key={index}
          className={`aspect-square border-b border-r border-slate-950/30 ${
            index < shaded ? "bg-indigo-300" : "bg-slate-800"
          }`}
        />
      ))}
    </div>
  );
}

function DecimalPlaceValue({ value }: { value: string }) {
  const normalized = value.replace(".", ",");
  const [whole = "0", decimals = ""] = normalized.split(",");
  const digits = decimals.padEnd(3, "0").slice(0, 3);
  const cells = [
    ["Parte entera", whole],
    ["Décimos", digits[0]],
    ["Centésimos", digits[1]],
    ["Milésimos", digits[2]],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {cells.map(([title, digit]) => (
        <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-center">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-teal-200">{digit}</p>
        </div>
      ))}
    </div>
  );
}

export default function MathConceptModel({
  data,
}: {
  data: ModelData;
}) {
  const mode = String(data.mode ?? "fraction_bar");
  const caption = String(data.caption ?? "");

  let content = null;

  if (mode === "fraction_equivalence") {
    const numerator = asInteger(data.numerator, 2, 0, 12);
    const denominator = asInteger(data.denominator, 3, 1, 12);
    const multiplier = asInteger(data.multiplier, 2, 1, 6);
    content = (
      <div className="grid gap-7 md:grid-cols-2">
        <FractionBar numerator={numerator} denominator={denominator} label="Fracción inicial" />
        <FractionBar
          numerator={numerator * multiplier}
          denominator={denominator * multiplier}
          label="Fracción equivalente"
        />
      </div>
    );
  } else if (mode === "mixed_number") {
    const wholes = asInteger(data.wholes, 1, 0, 4);
    const numerator = asInteger(data.numerator, 3, 0, 12);
    const denominator = asInteger(data.denominator, 4, 1, 12);
    content = (
      <div className="space-y-4">
        {Array.from({ length: wholes }, (_, index) => (
          <FractionBar key={index} numerator={denominator} denominator={denominator} label={`Unidad ${index + 1}`} />
        ))}
        <FractionBar numerator={numerator} denominator={denominator} label="Parte adicional" />
      </div>
    );
  } else if (mode === "fraction_addition") {
    const ln = asInteger(data.left_numerator, 1, 0, 12);
    const ld = asInteger(data.left_denominator, 3, 1, 12);
    const rn = asInteger(data.right_numerator, 1, 0, 12);
    const rd = asInteger(data.right_denominator, 4, 1, 12);
    const resultN = asInteger(data.result_numerator, 7, 0, 24);
    const resultD = asInteger(data.result_denominator, 12, 1, 24);
    content = (
      <div className="space-y-7">
        <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <FractionBar numerator={ln} denominator={ld} />
          <span className="text-center text-3xl font-black text-amber-200">+</span>
          <FractionBar numerator={rn} denominator={rd} />
        </div>
        <div className="text-center text-3xl font-black text-slate-500">↓</div>
        <FractionBar numerator={resultN} denominator={resultD} label="Resultado con partes comunes" />
      </div>
    );
  } else if (mode === "decimal_grid") {
    const hundredths = asInteger(data.hundredths, 75, 0, 100);
    content = (
      <div>
        <DecimalGrid hundredths={hundredths} />
        <p className="mt-4 text-center font-mono text-xl font-black text-indigo-200">
          {hundredths}/100 = {(hundredths / 100).toLocaleString("es-CL", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    );
  } else if (mode === "decimal_place_value") {
    content = <DecimalPlaceValue value={String(data.value ?? "0,000")} />;
  } else if (mode === "decimal_operation") {
    content = (
      <div className="mx-auto max-w-sm rounded-2xl bg-slate-950/55 p-6 font-mono text-3xl font-black">
        <div className="text-right">{String(data.top ?? "")}</div>
        <div className="mt-2 flex justify-between border-b border-white/30 pb-3">
          <span className="text-amber-200">{String(data.operator ?? "+")}</span>
          <span>{String(data.bottom ?? "")}</span>
        </div>
        <div className="mt-3 text-right text-teal-200">{String(data.result ?? "")}</div>
      </div>
    );
  } else if (mode === "fraction_decimal_match") {
    const n = asInteger(data.fraction_numerator, 3, 0, 12);
    const d = asInteger(data.fraction_denominator, 4, 1, 12);
    content = (
      <div className="grid items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
        <FractionBar numerator={n} denominator={d} />
        <span className="text-center text-4xl font-black text-amber-200">=</span>
        <div className="rounded-3xl border border-indigo-300/20 bg-indigo-300/10 p-8 text-center">
          <p className="text-sm font-black uppercase tracking-wide text-indigo-200">Representación decimal</p>
          <p className="mt-3 text-6xl font-black text-white">{String(data.decimal ?? "0,75")}</p>
        </div>
      </div>
    );
  } else {
    content = (
      <FractionBar
        numerator={asInteger(data.numerator, 1, 0, 12)}
        denominator={asInteger(data.denominator, 2, 1, 12)}
      />
    );
  }

  return (
    <div className="rounded-3xl border border-teal-300/20 bg-gradient-to-br from-teal-300/[0.07] to-indigo-300/[0.05] p-6 sm:p-8">
      {content}
      {caption && <p className="mt-6 text-center text-sm leading-6 text-slate-400">{caption}</p>}
    </div>
  );
}
