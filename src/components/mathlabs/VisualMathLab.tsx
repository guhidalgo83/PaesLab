"use client";

import { useMemo, useState } from "react";
import type { VisualLabDefinition } from "@/data/fifth-grade-visual-labs";

function NumberCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-center">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function PlaceValuePlayground() {
  const [number, setNumber] = useState(245901);
  const formatted = number.toLocaleString("es-CL");
  const digits = String(number).padStart(6, "0").split("");
  const labels = ["Centenas de mil", "Decenas de mil", "Unidades de mil", "Centenas", "Decenas", "Unidades"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="font-black text-cyan-100" htmlFor="big-number">Número:</label>
        <input
          id="big-number"
          type="number"
          min={100000}
          max={999999}
          value={number}
          onChange={(event) => setNumber(Math.max(100000, Math.min(999999, Number(event.target.value) || 100000)))}
          className="rounded-2xl border border-white/15 bg-slate-950 px-4 py-3 text-xl font-black text-white outline-none focus:border-cyan-300"
        />
        <span className="text-2xl font-black text-cyan-200">{formatted}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {digits.map((digit, index) => <NumberCard key={labels[index]} label={labels[index]} value={digit} />)}
      </div>
      <div className="rounded-2xl bg-cyan-300/[0.07] p-5 text-sm leading-7 text-slate-300">
        Cambia el número y observa cómo una cifra cambia de valor cuando cambia de posición.
      </div>
    </div>
  );
}

function MultiplicationPlayground() {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(6);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <span className="font-black text-amber-100">Filas: {rows}</span>
          <input className="mt-3 w-full accent-amber-300" type="range" min="2" max="12" value={rows} onChange={(e) => setRows(Number(e.target.value))} />
        </label>
        <label className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <span className="font-black text-amber-100">Columnas: {cols}</span>
          <input className="mt-3 w-full accent-amber-300" type="range" min="2" max="12" value={cols} onChange={(e) => setCols(Number(e.target.value))} />
        </label>
      </div>
      <p className="text-center text-4xl font-black text-white">{rows} × {cols} = <span className="text-amber-200">{rows * cols}</span></p>
      <div className="mx-auto grid w-fit gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1.35rem)` }}>
        {Array.from({ length: rows * cols }, (_, index) => <span key={index} className="h-5 w-5 rounded-md bg-amber-300 shadow-sm shadow-amber-300/20" />)}
      </div>
    </div>
  );
}

function DivisionPlayground() {
  const [total, setTotal] = useState(26);
  const [groupSize, setGroupSize] = useState(4);
  const quotient = Math.floor(total / groupSize);
  const remainder = total % groupSize;
  const groups = Array.from({ length: quotient }, (_, index) => index);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <span className="font-black text-indigo-100">Objetos: {total}</span>
          <input className="mt-3 w-full accent-indigo-300" type="range" min="8" max="48" value={total} onChange={(e) => setTotal(Number(e.target.value))} />
        </label>
        <label className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <span className="font-black text-indigo-100">Tamaño del grupo: {groupSize}</span>
          <input className="mt-3 w-full accent-indigo-300" type="range" min="2" max="10" value={groupSize} onChange={(e) => setGroupSize(Number(e.target.value))} />
        </label>
      </div>
      <p className="text-center text-3xl font-black text-white">{total} ÷ {groupSize} = <span className="text-indigo-200">{quotient}</span>{remainder ? <span className="text-slate-400"> resto {remainder}</span> : null}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <div key={group} className="rounded-2xl border border-indigo-300/20 bg-indigo-300/[0.06] p-4">
            <p className="text-center text-xs font-black uppercase tracking-wide text-indigo-200">Grupo {group + 1}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {Array.from({ length: groupSize }, (_, index) => <span key={index} className="h-5 w-5 rounded-full bg-indigo-300" />)}
            </div>
          </div>
        ))}
      </div>
      {remainder ? (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] p-4 text-center">
          <p className="font-black text-rose-100">Sobran {remainder} objeto{remainder === 1 ? "" : "s"}.</p>
        </div>
      ) : null}
    </div>
  );
}

function LengthPlayground() {
  const [centimeters, setCentimeters] = useState(340);
  const meters = centimeters / 100;
  const millimeters = centimeters * 10;
  return (
    <div className="space-y-6">
      <label className="block rounded-2xl border border-white/10 bg-slate-950/45 p-5">
        <span className="font-black text-emerald-100">Centímetros: {centimeters}</span>
        <input className="mt-3 w-full accent-emerald-300" type="range" min="10" max="1000" step="10" value={centimeters} onChange={(e) => setCentimeters(Number(e.target.value))} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberCard label="Milímetros" value={millimeters.toLocaleString("es-CL")} />
        <NumberCard label="Centímetros" value={centimeters.toLocaleString("es-CL")} />
        <NumberCard label="Metros" value={meters.toLocaleString("es-CL", { maximumFractionDigits: 2 })} />
      </div>
      <div className="relative h-16 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45">
        <div className="absolute left-5 right-5 top-8 h-1 bg-white/20" />
        {Array.from({ length: 11 }, (_, index) => (
          <div key={index} className="absolute top-5 h-7 w-px bg-emerald-300/80" style={{ left: `calc(1.25rem + ${index * 9}%)` }}>
            <span className="absolute top-7 -translate-x-1/2 text-[10px] font-black text-slate-500">{index * 10}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecimalPlayground() {
  const [hundredths, setHundredths] = useState(37);
  const decimal = (hundredths / 100).toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="space-y-6">
      <label className="block rounded-2xl border border-white/10 bg-slate-950/45 p-5">
        <span className="font-black text-sky-100">Centésimos pintados: {hundredths}</span>
        <input className="mt-3 w-full accent-sky-300" type="range" min="0" max="100" value={hundredths} onChange={(e) => setHundredths(Number(e.target.value))} />
      </label>
      <div className="mx-auto grid w-full max-w-sm grid-cols-10 overflow-hidden rounded-2xl border border-white/15">
        {Array.from({ length: 100 }, (_, index) => <span key={index} className={`aspect-square border-b border-r border-slate-950/30 ${index < hundredths ? "bg-sky-300" : "bg-slate-800"}`} />)}
      </div>
      <p className="text-center text-3xl font-black text-white">{hundredths}/100 = <span className="text-sky-200">{decimal}</span></p>
    </div>
  );
}

function PatternPlayground() {
  const [start, setStart] = useState(4);
  const [step, setStep] = useState(3);
  const values = Array.from({ length: 6 }, (_, index) => start + index * step);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <span className="font-black text-fuchsia-100">Comienza en: {start}</span>
          <input className="mt-3 w-full accent-fuchsia-300" type="range" min="0" max="20" value={start} onChange={(e) => setStart(Number(e.target.value))} />
        </label>
        <label className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <span className="font-black text-fuchsia-100">Aumenta en: {step}</span>
          <input className="mt-3 w-full accent-fuchsia-300" type="range" min="1" max="10" value={step} onChange={(e) => setStep(Number(e.target.value))} />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-fuchsia-300/15 text-xl font-black text-fuchsia-100">{value}</span>
            {index < values.length - 1 ? <span className="font-black text-slate-600">→</span> : null}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-slate-400">Regla: comenzar en {start} y sumar {step} cada vez.</p>
    </div>
  );
}

function FractionStrip({ numerator, denominator }: { numerator: number; denominator: number }) {
  return (
    <div>
      <div className="grid overflow-hidden rounded-xl border border-white/15" style={{ gridTemplateColumns: `repeat(${denominator}, minmax(0, 1fr))` }}>
        {Array.from({ length: denominator }, (_, index) => <span key={index} className={`h-12 border-r border-slate-950/40 last:border-r-0 ${index < numerator ? "bg-rose-300" : "bg-slate-800"}`} />)}
      </div>
      <p className="mt-2 text-center font-mono font-black text-rose-100">{numerator}/{denominator}</p>
    </div>
  );
}

function FractionPlayground() {
  const [denominator, setDenominator] = useState(4);
  const [numerator, setNumerator] = useState(3);
  const safeNumerator = Math.min(numerator, denominator);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <span className="font-black text-rose-100">Denominador: {denominator}</span>
          <input className="mt-3 w-full accent-rose-300" type="range" min="2" max="10" value={denominator} onChange={(e) => { const next = Number(e.target.value); setDenominator(next); setNumerator((current) => Math.min(current, next)); }} />
        </label>
        <label className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
          <span className="font-black text-rose-100">Numerador: {safeNumerator}</span>
          <input className="mt-3 w-full accent-rose-300" type="range" min="1" max={denominator} value={safeNumerator} onChange={(e) => setNumerator(Number(e.target.value))} />
        </label>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <FractionStrip numerator={safeNumerator} denominator={denominator} />
        <FractionStrip numerator={safeNumerator * 2} denominator={denominator * 2} />
      </div>
      <p className="text-center text-sm leading-6 text-slate-400">Multiplicar numerador y denominador por el mismo número crea una fracción equivalente.</p>
    </div>
  );
}

function DataPlayground() {
  const [values, setValues] = useState([6, 8, 5, 9, 7]);
  const labels = ["Lun", "Mar", "Mié", "Jue", "Vie"];
  const max = Math.max(...values, 1);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-5">
        {values.map((value, index) => (
          <label key={labels[index]} className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-center">
            <span className="text-xs font-black text-violet-100">{labels[index]}: {value}</span>
            <input className="mt-3 w-full accent-violet-300" type="range" min="1" max="12" value={value} onChange={(e) => setValues((current) => current.map((item, itemIndex) => itemIndex === index ? Number(e.target.value) : item))} />
          </label>
        ))}
      </div>
      <div className="grid h-64 grid-cols-5 items-end gap-3 rounded-3xl border border-white/10 bg-slate-950/45 p-5">
        {values.map((value, index) => (
          <div key={labels[index]} className="flex h-full flex-col justify-end gap-2">
            <div className="flex items-start justify-center rounded-t-2xl bg-gradient-to-t from-violet-400 to-cyan-300 pt-2 font-black text-slate-950" style={{ height: `${Math.max(12, (value / max) * 100)}%` }}>{value}</div>
            <p className="text-center text-xs font-black text-slate-400">{labels[index]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LabPlayground({ type }: { type: VisualLabDefinition["type"] }) {
  if (type === "place_value") return <PlaceValuePlayground />;
  if (type === "multiplication") return <MultiplicationPlayground />;
  if (type === "division") return <DivisionPlayground />;
  if (type === "length") return <LengthPlayground />;
  if (type === "decimals") return <DecimalPlayground />;
  if (type === "patterns") return <PatternPlayground />;
  if (type === "fractions") return <FractionPlayground />;
  return <DataPlayground />;
}

export default function VisualMathLab({
  lab,
  saving,
  saved,
  onSave,
}: {
  lab: VisualLabDefinition;
  saving: boolean;
  saved: boolean;
  onSave: (score: number) => Promise<void>;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const answeredCount = Object.keys(answers).length;
  const correctCount = useMemo(
    () => lab.challenges.reduce((total, challenge, index) => total + (answers[index] === challenge.answer ? 1 : 0), 0),
    [answers, lab.challenges],
  );
  const score = Math.round((correctCount / lab.challenges.length) * 100);
  const complete = answeredCount === lab.challenges.length;

  return (
    <div className="space-y-8">
      <section className={`rounded-[2.5rem] border border-white/10 bg-gradient-to-br ${lab.gradient} p-6 sm:p-8`}>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">Experimenta</p>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Mueve, cambia y observa</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-300">Aquí no hay una única configuración correcta. Cambia los controles y busca regularidades.</p>
        <div className="mt-7 rounded-[2rem] border border-white/10 bg-slate-950/30 p-5 sm:p-7">
          <LabPlayground type={lab.type} />
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-200">Misión de laboratorio</p>
        <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Demuestra lo que descubriste</h2>
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {lab.challenges.map((challenge, index) => {
            const selected = answers[index];
            const isCorrect = selected === challenge.answer;
            return (
              <article key={challenge.prompt} className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Desafío {index + 1}</p>
                <p className="mt-3 font-bold leading-7 text-white">{challenge.prompt}</p>
                <div className="mt-4 grid gap-2">
                  {challenge.options.map((option) => {
                    const chosen = selected === option;
                    const stateClass = !selected
                      ? "border-white/10 bg-white/[0.03] text-slate-200 hover:border-cyan-300/40"
                      : chosen
                        ? isCorrect
                          ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                          : "border-rose-300/40 bg-rose-300/10 text-rose-100"
                        : "border-white/5 bg-white/[0.02] text-slate-500";
                    return (
                      <button
                        type="button"
                        key={option}
                        disabled={Boolean(selected)}
                        onClick={() => setAnswers((current) => ({ ...current, [index]: option }))}
                        className={`rounded-xl border px-3 py-3 text-left text-sm font-bold transition ${stateClass}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {selected ? (
                  <div className={`mt-4 rounded-xl p-3 text-sm leading-6 ${isCorrect ? "bg-emerald-300/[0.07] text-emerald-100" : "bg-rose-300/[0.07] text-rose-100"}`}>
                    <p className="font-black">{isCorrect ? "¡Correcto!" : `Respuesta: ${challenge.answer}`}</p>
                    <p className="mt-1 opacity-80">{challenge.explanation}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {complete ? (
          <div className="mt-7 rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.06] p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-cyan-200">Resultado</p>
                <p className="mt-2 text-4xl font-black text-white">{score}%</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {score >= 70 ? "Laboratorio superado. Tu mejor resultado quedará guardado." : "Conviene volver a experimentar y repetir la misión."}
                </p>
              </div>
              <button
                type="button"
                disabled={saving || saved}
                onClick={() => void onSave(score)}
                className="rounded-2xl bg-cyan-300 px-6 py-4 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saved ? "Resultado guardado ✓" : saving ? "Guardando..." : "Guardar resultado"}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
