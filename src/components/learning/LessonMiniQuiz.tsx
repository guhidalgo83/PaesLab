"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import QuestionVisual from "@/components/QuestionVisual";
import type { LearningQuestion } from "@/types/learning";

type LessonMiniQuizProps = {
  lessonId: string;
  questions: LearningQuestion[];
  userId: string | null;
  onCompleted: (score: number) => void;
};

export default function LessonMiniQuiz({ lessonId, questions, userId, onCompleted }: LessonMiniQuizProps) {
  const supabase = useMemo(() => createClient(), []);
  const selectedQuestions = questions.slice(0, 3);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Array<{question_id:string;selected_index:number;is_correct:boolean}>>([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  if (selectedQuestions.length === 0) {
    return <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"><h2 className="text-2xl font-black">Comprueba tu aprendizaje</h2><p className="mt-3 text-slate-400">Aún no hay preguntas vinculadas a esta lección. Ejecuta el script de vinculación automática.</p></section>;
  }

  if (finished) {
    const correct = answers.filter((answer) => answer.is_correct).length;
    const score = Math.round((correct / selectedQuestions.length) * 100);
    return <section className="rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] p-7 text-center"><p className="text-sm font-black uppercase text-emerald-200">Mini evaluación completada</p><p className="mt-3 text-6xl font-black text-teal-300">{score}%</p><p className="mt-3 text-slate-300">{correct} correctas de {selectedQuestions.length}</p><p className="mt-4 text-sm text-slate-400">La lección quedó registrada como completada.</p></section>;
  }

  const question = selectedQuestions[index];
  const isCorrect = checked && selected === question.correct_index;

  async function next() {
    if (selected === null) return;
    const nextAnswers = [...answers, { question_id: question.id, selected_index: selected, is_correct: selected === question.correct_index }];
    if (index + 1 < selectedQuestions.length) {
      setAnswers(nextAnswers); setIndex(index+1); setSelected(null); setChecked(false); return;
    }
    setSaving(true);
    const correct = nextAnswers.filter((answer)=>answer.is_correct).length;
    const score = Math.round((correct / selectedQuestions.length)*100);
    if (userId) {
      await supabase.from("lesson_quiz_attempts").insert({ user_id:userId, lesson_id:lessonId, score, correct_answers:correct, total_questions:selectedQuestions.length, answers:nextAnswers });
      await supabase.rpc("complete_learning_lesson", { p_lesson_id: lessonId, p_quiz_score: score });
    }
    setAnswers(nextAnswers); setFinished(true); setSaving(false); onCompleted(score);
  }

  return <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"><div className="flex items-center justify-between gap-4"><div><p className="font-bold text-indigo-300">Comprueba tu aprendizaje</p><h2 className="mt-2 text-2xl font-black">Pregunta {index+1} de {selectedQuestions.length}</h2></div><span className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">{Math.round((index/selectedQuestions.length)*100)}%</span></div><p className="mt-7 text-xl font-black leading-8">{question.prompt}</p><QuestionVisual visualType={question.visual_type} visualData={question.visual_data} imageUrl={question.image_url} imageAlt={question.image_alt} compact />
  <div className="mt-6 grid gap-3">{question.options.map((option,optionIndex)=>{const chosen=selected===optionIndex;const correctOption=checked&&optionIndex===question.correct_index;const wrong=checked&&chosen&&!correctOption;return <button key={optionIndex} disabled={checked} onClick={()=>setSelected(optionIndex)} className={`flex items-center gap-3 rounded-xl border p-4 text-left ${correctOption?'border-emerald-300 bg-emerald-300/10':wrong?'border-rose-300 bg-rose-300/10':chosen?'border-teal-300 bg-teal-300/10':'border-white/10 bg-slate-900/60'}`}><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 font-black text-teal-300">{String.fromCharCode(65+optionIndex)}</span><span>{option}</span></button>})}</div>
  {!checked ? <button disabled={selected===null} onClick={()=>setChecked(true)} className="mt-6 w-full rounded-xl bg-teal-300 px-5 py-4 font-black text-slate-950 disabled:opacity-40">Corregir</button> : <div className={`mt-6 rounded-xl border p-5 ${isCorrect?'border-emerald-300/30 bg-emerald-300/10':'border-rose-300/30 bg-rose-300/10'}`}><p className="font-black">{isCorrect?'✓ Correcta':'✕ Revisa este paso'}</p><p className="mt-3 leading-7 text-slate-300">{question.explanation}</p><button disabled={saving} onClick={()=>void next()} className="mt-5 w-full rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950">{saving?'Guardando...':index+1===selectedQuestions.length?'Finalizar lección':'Siguiente pregunta →'}</button></div>}
  {!userId && <p className="mt-4 text-center text-sm text-amber-200">Puedes practicar, pero debes iniciar sesión para guardar el progreso.</p>}</section>;
}
