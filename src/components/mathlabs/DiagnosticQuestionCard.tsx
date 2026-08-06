"use client";

import type {
  DiagnosticAnswerResult,
  DiagnosticOption,
  DiagnosticQuestionPayload,
} from "@/types/diagnostic";

type Props = {
  question: DiagnosticQuestionPayload;
  selectedOption: string;
  confidence: string;
  answerResult: DiagnosticAnswerResult | null;
  submitting: boolean;
  onSelect: (option: string) => void;
  onConfidence: (confidence: string) => void;
  onSubmit: () => void;
  onNext: () => void;
};

const confidenceOptions = [
  { id: "guessing", label: "Estoy adivinando" },
  { id: "unsure", label: "Tengo algunas dudas" },
  { id: "confident", label: "Estoy seguro/a" },
];

export default function DiagnosticQuestionCard({
  question,
  selectedOption,
  confidence,
  answerResult,
  submitting,
  onSelect,
  onConfidence,
  onSubmit,
  onNext,
}: Props) {
  const options = (question.options ?? []) as DiagnosticOption[];
  const current = question.position ?? question.answered_questions + 1;
  const progress = question.total_questions
    ? Math.round(((current - 1) / question.total_questions) * 100)
    : 0;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-teal-300">
            Pregunta {current} de {question.total_questions}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {question.topic_title} · {question.difficulty}
          </p>
        </div>
        <span className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black text-indigo-200">
          {progress}% avanzado
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-300 to-indigo-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h1 className="mt-8 text-2xl font-black leading-9 sm:text-3xl">
        {question.prompt}
      </h1>

      <div className="mt-7 grid gap-3">
        {options.map((option) => {
          const selected = selectedOption === option.id;
          const isCorrectOption = answerResult?.correct_option === option.id;
          const isWrongSelected = Boolean(
            answerResult && selected && !answerResult.is_correct,
          );

          let style = "border-white/10 bg-slate-950/45 hover:border-indigo-300/40";
          if (selected) style = "border-indigo-300/60 bg-indigo-300/[0.08]";
          if (isCorrectOption) style = "border-emerald-300/60 bg-emerald-300/[0.08]";
          if (isWrongSelected) style = "border-rose-300/60 bg-rose-300/[0.08]";

          return (
            <button
              key={option.id}
              type="button"
              disabled={Boolean(answerResult)}
              onClick={() => onSelect(option.id)}
              className={`flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${style}`}
            >
              <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white/10 font-black">
                {option.id}
              </span>
              <span className="pt-1 font-bold leading-7">{option.text}</span>
            </button>
          );
        })}
      </div>

      {!answerResult && (
        <div className="mt-7 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-5">
          <p className="font-black text-amber-200">¿Qué tan seguro/a estás?</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {confidenceOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onConfidence(item.id)}
                className={`rounded-xl px-4 py-2 text-sm font-black ${
                  confidence === item.id
                    ? "bg-amber-300 text-slate-950"
                    : "border border-white/15 text-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {answerResult && (
        <div
          className={`mt-7 rounded-2xl border p-5 ${
            answerResult.is_correct
              ? "border-emerald-300/25 bg-emerald-300/[0.06]"
              : "border-rose-300/25 bg-rose-300/[0.06]"
          }`}
        >
          <p
            className={`font-black ${
              answerResult.is_correct ? "text-emerald-200" : "text-rose-200"
            }`}
          >
            {answerResult.is_correct
              ? "Respuesta correcta"
              : `La respuesta correcta era ${answerResult.correct_option}`}
          </p>
          {answerResult.feedback && (
            <p className="mt-3 leading-7 text-slate-200">{answerResult.feedback}</p>
          )}
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {answerResult.explanation}
          </p>
        </div>
      )}

      <div className="mt-7 flex justify-end">
        {answerResult ? (
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl bg-teal-300 px-6 py-3 font-black text-slate-950"
          >
            Siguiente pregunta
          </button>
        ) : (
          <button
            type="button"
            disabled={!selectedOption || submitting}
            onClick={onSubmit}
            className="rounded-xl bg-indigo-300 px-6 py-3 font-black text-slate-950 disabled:opacity-40"
          >
            {submitting ? "Guardando..." : "Responder"}
          </button>
        )}
      </div>
    </section>
  );
}
