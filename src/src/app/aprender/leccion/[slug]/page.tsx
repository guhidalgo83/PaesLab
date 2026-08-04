"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LearningHeader from "@/components/learning/LearningHeader";
import LessonBlockRenderer from "@/components/learning/LessonBlockRenderer";
import LessonMiniQuiz from "@/components/learning/LessonMiniQuiz";
import type { LearningQuestion, LearningUnit, Lesson, LessonBlock } from "@/types/learning";

export default function LessonPage(){
 const params=useParams();const supabase=useMemo(()=>createClient(),[]);const [lesson,setLesson]=useState<Lesson|null>(null);const [unit,setUnit]=useState<LearningUnit|null>(null);const [blocks,setBlocks]=useState<LessonBlock[]>([]);const [questions,setQuestions]=useState<LearningQuestion[]>([]);const [userId,setUserId]=useState<string|null>(null);const [completed,setCompleted]=useState(false);const [loading,setLoading]=useState(true);
 useEffect(()=>{void load();},[params]);
 async function load(){const slug=String(params.slug??'');const {data:lessonData}=await supabase.from('lessons').select('*').eq('slug',slug).eq('is_published',true).maybeSingle();if(!lessonData){setLoading(false);return;}const currentLesson=lessonData as Lesson;setLesson(currentLesson);const [{data:unitData},{data:blockData},{data:{user}}]=await Promise.all([supabase.from('learning_units').select('*').eq('id',currentLesson.unit_id).single(),supabase.from('lesson_blocks').select('*').eq('lesson_id',currentLesson.id).order('sort_order'),supabase.auth.getUser()]);setUnit(unitData as LearningUnit);setBlocks((blockData??[]) as LessonBlock[]);setUserId(user?.id??null);
 if(user){const {data:p}=await supabase.from('lesson_progress').select('status').eq('user_id',user.id).eq('lesson_id',currentLesson.id).maybeSingle();setCompleted(p?.status==='completed');if(!p)await supabase.from('lesson_progress').insert({user_id:user.id,lesson_id:currentLesson.id,status:'in_progress',progress_percent:10,started_at:new Date().toISOString()});}
 const {data:links}=await supabase.from('lesson_question_links').select('sort_order,questions(id,prompt,options,correct_index,explanation,visual_type,visual_data,image_url,image_alt)').eq('lesson_id',currentLesson.id).eq('purpose','mini_quiz').order('sort_order').limit(3);
 let linked=(links??[]).map((row:any)=>Array.isArray(row.questions)?row.questions[0]:row.questions).filter(Boolean) as LearningQuestion[];
 if(linked.length<3 && unitData){const {data:fallback}=await supabase.from('questions').select('id,prompt,options,correct_index,explanation,visual_type,visual_data,image_url,image_alt').eq('is_active',true).eq('test_type',unitData.test_type).eq('axis',unitData.axis).limit(20);linked=[...linked,...((fallback??[]) as LearningQuestion[]).filter(q=>!linked.some(x=>x.id===q.id))].slice(0,3);}setQuestions(linked);setLoading(false);}
 if(loading)return <main className="grid min-h-screen place-items-center bg-slate-950 text-white">Cargando lección...</main>;
 if(!lesson||!unit)return <main className="grid min-h-screen place-items-center bg-slate-950 text-white"><h1 className="text-3xl font-black">Lección no encontrada</h1></main>;
 return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white"><div className="mx-auto max-w-4xl"><LearningHeader title={lesson.title} subtitle={`${unit.axis} · ${lesson.estimated_minutes} min`} />
 <article className="py-10"><a href={`/aprender/${unit.test_type.toLowerCase()}/${unit.slug}`} className="text-sm font-bold text-slate-400 hover:text-teal-300">← Volver a {unit.title}</a><div className="mt-6"><div className="flex flex-wrap gap-2"><span className="rounded-lg bg-indigo-300/10 px-3 py-1 text-sm font-bold text-indigo-200">{lesson.difficulty}</span>{completed&&<span className="rounded-lg bg-emerald-300/10 px-3 py-1 text-sm font-bold text-emerald-200">Completada</span>}</div><h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">{lesson.title}</h1><p className="mt-4 text-lg leading-8 text-slate-400">{lesson.summary}</p></div>
 <div className="mt-10 space-y-10">{blocks.filter(b=>b.block_type!=='practice').map(block=><LessonBlockRenderer key={block.id} block={block} />)}<LessonMiniQuiz lessonId={lesson.id} questions={questions} userId={userId} onCompleted={()=>setCompleted(true)} /></div>
 <div className="mt-10 flex flex-col gap-3 sm:flex-row"><a href="/ruta-estudio" className="rounded-xl border border-indigo-300/30 px-5 py-3 text-center font-black text-indigo-200">Continuar mi ruta</a><a href={`/entrenar`} className="rounded-xl bg-teal-300 px-5 py-3 text-center font-black text-slate-950">Practicar más preguntas</a></div>
 </article></div></main>;
}
