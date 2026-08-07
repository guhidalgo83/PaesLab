"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import SchoolPracticeQuestionCard from "@/components/mathlabs/SchoolPracticeQuestionCard";
import { createClient } from "@/lib/supabase/client";
import type { KnowledgeTopic } from "@/types/school";
import type { SchoolPracticeAnswer, SchoolPracticeCompletion, SchoolPracticeQuestion, SchoolPracticeStart } from "@/types/school-practice";

export default function SchoolPracticePage() {
  const params = useParams(); const router = useRouter(); const supabase = useMemo(() => createClient(), []);
  const topicSlug = String(params.topicSlug ?? "");
  const [topic,setTopic]=useState<KnowledgeTopic|null>(null); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  const [session,setSession]=useState<SchoolPracticeStart|null>(null); const [question,setQuestion]=useState<SchoolPracticeQuestion|null>(null); const [selected,setSelected]=useState(""); const [confidence,setConfidence]=useState("unsure"); const [answer,setAnswer]=useState<SchoolPracticeAnswer|null>(null); const [completion,setCompletion]=useState<SchoolPracticeCompletion|null>(null);
  const startedAt=useRef<number|null>(null);

  const initialize=useCallback(async()=>{ const {data:{user}}=await supabase.auth.getUser(); if(!user){router.replace("/login");return;} const {data,error}=await supabase.from("knowledge_topics").select("*").eq("slug",topicSlug).eq("is_published",true).maybeSingle(); if(error||!data)setMessage(error?.message??"Tema no encontrado"); else setTopic(data as unknown as KnowledgeTopic); setLoading(false); },[router,supabase,topicSlug]);
  useEffect(()=>{ const id=window.setTimeout(()=>{void initialize();},0); return()=>window.clearTimeout(id); },[initialize]);

  async function loadQuestion(sessionId:string){ setBusy(true); const {data,error}=await supabase.rpc("get_school_practice_question",{p_session_id:sessionId}); if(error){setMessage(error.message);setBusy(false);return;} const payload=data as SchoolPracticeQuestion; if(payload.complete){const done=await supabase.rpc("complete_school_practice",{p_session_id:sessionId}); if(done.error)setMessage(done.error.message); else setCompletion(done.data as SchoolPracticeCompletion); setQuestion(null);} else {setQuestion(payload);setSelected("");setConfidence("unsure");setAnswer(null);startedAt.current=Date.now();} setBusy(false); }
  async function start(){ setBusy(true);setMessage(""); const {data,error}=await supabase.rpc("start_school_practice",{p_topic_slug:topicSlug,p_question_count:8}); if(error){setMessage(error.message);setBusy(false);return;} const created=data as SchoolPracticeStart;setSession(created);setBusy(false);await loadQuestion(created.session_id); }
  async function submit(){ if(!session||!question?.item_id||!selected)return;setBusy(true); const seconds=Math.max(0,Math.round((Date.now()-(startedAt.current??Date.now()))/1000)); const {data,error}=await supabase.rpc("submit_school_practice_answer",{p_session_id:session.session_id,p_item_id:question.item_id,p_selected_option:selected,p_confidence_level:confidence,p_time_seconds:seconds}); if(error)setMessage(error.message); else setAnswer(data as SchoolPracticeAnswer); setBusy(false); }

  if(loading)return <main className="grid min-h-screen place-items-center bg-slate-950 text-white">Preparando práctica...</main>;
  return <main className="min-h-screen bg-slate-950 text-white"><MathLabsHeader/><section className="mx-auto max-w-4xl px-5 py-12"><Link href={topic?`/matematica/tema/${topic.slug}`:"/matematica"} className="text-sm font-bold text-slate-400">← Volver al tema</Link><p className="mt-8 font-black text-teal-300">Práctica escolar segura</p><h1 className="mt-2 text-4xl font-black sm:text-6xl">{topic?.title??"Tema"}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">Ocho preguntas, retroalimentación por alternativa y actualización automática de tu dominio.</p>{message&&<p className="mt-6 rounded-xl bg-rose-300/10 p-4 text-rose-200">{message}</p>}
  {!session&&!completion&&<section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-7"><h2 className="text-2xl font-black">¿Listo para practicar?</h2><p className="mt-3 leading-7 text-slate-400">Las respuestas correctas se mantienen en Supabase y solo se revelan después de cada intento.</p><button disabled={busy||!topic} onClick={()=>void start()} className="mt-6 rounded-xl bg-teal-300 px-6 py-4 font-black text-slate-950 disabled:opacity-50">{busy?"Preparando...":"Comenzar 8 preguntas"}</button></section>}
  {question&&<div className="mt-10"><SchoolPracticeQuestionCard question={question} selected={selected} confidence={confidence} answer={answer} busy={busy} onSelect={setSelected} onConfidence={setConfidence} onSubmit={()=>void submit()} onNext={()=>session&&void loadQuestion(session.session_id)}/></div>}
  {completion&&<section className="mt-10 rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] p-8 text-center"><p className="font-black uppercase text-emerald-200">Práctica completada</p><p className="mt-4 text-7xl font-black text-teal-300">{completion.score_percent}%</p><p className="mt-3 text-slate-300">{completion.correct_answers} correctas de {completion.total_questions}</p><div className="mx-auto mt-6 grid max-w-xl gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-slate-950/40 p-5"><p className="text-sm text-slate-400">Dominio estimado</p><p className="mt-2 text-3xl font-black">{completion.mastery_percent}%</p></div><div className="rounded-2xl bg-slate-950/40 p-5"><p className="text-sm text-slate-400">Confianza</p><p className="mt-2 text-3xl font-black">{completion.confidence_percent}%</p></div></div><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={()=>{setSession(null);setCompletion(null);}} className="rounded-xl border border-white/15 px-5 py-3 font-black">Practicar nuevamente</button><Link href="/mi-ruta" className="rounded-xl bg-white px-5 py-3 font-black text-slate-950">Ver mi ruta</Link></div></section>}
  </section></main>;
}
