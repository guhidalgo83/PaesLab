"use client";

import type {
  SchoolReviewAnswer,
  SchoolReviewQuestion,
} from "@/types/school-review";

type Props = {
  question: SchoolReviewQuestion;
  selected: string;
  confidence: string;
  answer: SchoolReviewAnswer | null;
  busy: boolean;
  onSelect: (value: string) => void;
  onConfidence: (value: string) => void;
  onSubmit: () => void;
  onNext: () => void;
};

export default function SchoolReviewQuestionCard({
  question,
  selected,
  confidence,
  answer,
  busy,
  onSelect,
  onConfidence,
  onSubmit,
  onNext,
}: Props) {
  const progress = Math.round(
    ((question.answered_questions ?? 0) /
      Math.max(question.total_questions ?? 1, 1)) *
      100,
  );

  return (
    <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-slate-950/40 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-black text-cyan-200">
            Pregunta {question.position} de {question.total_questions}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {question.difficulty} · {question.skill}
          </p>
        </div>
        <span className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-white">
          {progress}%
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h1 className="mt-7 text-2xl font-black leading-9 text-white sm:text-3xl">
        {question.prompt}
      </h1>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {(question.options ?? []).map((option) => {
          const chosen = selected === option.id;
          const correct = Boolean(answer && option.id === answer.correct_option);
          const wrong = Boolean(answer && chosen && !correct);
          return (
            <button
              key={option.id}
              type="button"
              disabled={Boolean(answer) || busy}
              onClick={() => onSelect(option.id)}
              className={`flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left transition ${
                correct
                  ? "border-emerald-300 bg-emerald-300/10"
                  : wrong
                    ? "border-rose-300 bg-rose-300/10"
                    : chosen
                      ? "border-cyan-300 bg-cyan-300/10"
                      : "border-white/10 bg-slate-950/40 hover:border-white/25"
              }`}
            >
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-white/10 font-black text-cyan-200">
                {option.id}
              </span>
              <span className="leading-6 text-slate-100">{option.text}</span>
            </button>
          );
        })}
      </div>

      {!answer ? (
        <div className="mt-7 rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-5">
          <p className="text-sm font-black text-amber-100">
            ¿Qué tan seguro estás de tu respuesta?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["unsure", "Necesito revisar"],
              ["somewhat", "Creo que sí"],
              ["confident", "Estoy muy seguro"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onConfidence(value)}
                className={`rounded-xl border px-4 py-2 text-sm font-bold ${
                  confidence === value
                    ? "border-amber-300 bg-amber-300/10 text-amber-100"
                    : "border-white/10 text-slate-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!selected || busy}
            onClick={onSubmit}
            className="mt-5 w-full rounded-xl bg-cyan-300 px-5 py-4 font-black text-slate-950 disabled:opacity-40"
          >
            {busy ? "Revisando..." : "Comprobar respuesta"}
          </button>
        </div>
      ) : (
        <div
          className={`mt-7 rounded-2xl border p-5 ${
            answer.is_correct
              ? "border-emerald-300/30 bg-emerald-300/10"
              : "border-rose-300/30 bg-rose-300/10"
          }`}
        >
          <p className="text-lg font-black text-white">
            {answer.is_correct ? "🎉 ¡Correcto!" : "🧠 Aprendamos de este intento"}
          </p>
          <p className="mt-3 leading-7 text-slate-200">{answer.feedback}</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {answer.explanation}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={onNext}
            className="mt-5 w-full rounded-xl bg-white px-5 py-3 font-black text-slate-950"
          >
            Siguiente misión →
          </button>
        </div>
      )}
    </section>
  );
}
