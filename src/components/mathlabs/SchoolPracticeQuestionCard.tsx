"use client";

import type { SchoolPracticeAnswer, SchoolPracticeQuestion } from "@/types/school-practice";

type Props = {
  question: SchoolPracticeQuestion;
  selected: string;
  confidence: string;
  answer: SchoolPracticeAnswer | null;
  busy: boolean;
  onSelect: (value: string) => void;
  onConfidence: (value: string) => void;
  onSubmit: () => void;
  onNext: () => void;
};

export default function SchoolPracticeQuestionCard({ question, selected, confidence, answer, busy, onSelect, onConfidence, onSubmit, onNext }: Props) {
  const options = question.options ?? [];
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-black text-teal-300">Pregunta {question.position} de {question.total_questions}</p><p className="mt-1 text-sm text-slate-500">{question.difficulty} · {question.skill}</p></div>
        <span className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black">{Math.round(((question.answered_questions ?? 0) / Math.max(question.total_questions ?? 1,1))*100)}%</span>
      </div>
      <h1 className="mt-7 text-2xl font-black leading-9">{question.prompt}</h1>
      <div className="mt-6 grid gap-3">
        {options.map((option) => {
          const chosen = selected === option.id;
          const correct = Boolean(answer && option.id === answer.correct_option);
          const wrong = Boolean(answer && chosen && !correct);
          return <button key={option.id} disabled={Boolean(answer) || busy} onClick={() => onSelect(option.id)} className={`flex items-center gap-3 rounded-xl border p-4 text-left ${correct ? "border-emerald-300 bg-emerald-300/10" : wrong ? "border-rose-300 bg-rose-300/10" : chosen ? "border-teal-300 bg-teal-300/10" : "border-white/10 bg-slate-950/40"}`}>
            <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-white/10 font-black text-teal-300">{option.id}</span><span>{option.text}</span>
          </button>;
        })}
      </div>
      {!answer && <div className="mt-6"><p className="text-sm font-black text-slate-300">¿Qué tan seguro estás?</p><div className="mt-3 flex flex-wrap gap-2">{[["unsure","No estoy seguro"],["somewhat","Algo seguro"],["confident","Muy seguro"]].map(([value,label]) => <button key={value} onClick={() => onConfidence(value)} className={`rounded-xl border px-4 py-2 text-sm font-bold ${confidence===value ? "border-amber-300 bg-amber-300/10 text-amber-200" : "border-white/10 text-slate-400"}`}>{label}</button>)}</div><button disabled={!selected || busy} onClick={onSubmit} className="mt-5 w-full rounded-xl bg-teal-300 px-5 py-4 font-black text-slate-950 disabled:opacity-40">{busy ? "Corrigiendo..." : "Corregir respuesta"}</button></div>}
      {answer && <div className={`mt-6 rounded-2xl border p-5 ${answer.is_correct ? "border-emerald-300/30 bg-emerald-300/10" : "border-rose-300/30 bg-rose-300/10"}`}><p className="font-black">{answer.is_correct ? "✓ Correcta" : "Revisa tu razonamiento"}</p><p className="mt-3 leading-7 text-slate-300">{answer.feedback}</p><p className="mt-3 text-sm leading-6 text-slate-400">{answer.explanation}</p><button disabled={busy} onClick={onNext} className="mt-5 w-full rounded-xl bg-white px-5 py-3 font-black text-slate-950">Siguiente →</button></div>}
    </section>
  );
}
