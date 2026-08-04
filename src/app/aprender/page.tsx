"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LearningHeader from "@/components/learning/LearningHeader";
import ProgressBar from "@/components/learning/ProgressBar";
import type { LearningUnit, LessonProgress } from "@/types/learning";

type UnitWithCount = LearningUnit & { lessonCount: number; completedCount: number };

export default function LearnHomePage() {
  const supabase = useMemo(()=>createClient(),[]);
  const [units,setUnits]=useState<UnitWithCount[]>([]);
  const [stats,setStats]=useState({xp:0,level:1,current_streak:0,lessons_completed:0});
  const [loading,setLoading]=useState(true);

  useEffect(()=>{void load();},[]);
  async function load(){
    const [{data:unitData},{data:{user}}]=await Promise.all([supabase.from("learning_units").select("*").eq("is_published",true).order("test_type").order("sort_order"),supabase.auth.getUser()]);
    const {data:lessonData}=await supabase.from("lessons").select("id,unit_id").eq("is_published",true);
    let progress:LessonProgress[]=[];
    if(user){
      const {data}=await supabase.from("lesson_progress").select("lesson_id,status,progress_percent,best_quiz_score,last_block_order").eq("user_id",user.id);progress=(data??[]) as LessonProgress[];
      const {data:statData}=await supabase.from("user_learning_stats").select("xp,level,current_streak,lessons_completed").eq("user_id",user.id).maybeSingle();if(statData)setStats(statData);
    }
    const mapped=((unitData??[]) as LearningUnit[]).map(unit=>{const ids=(lessonData??[]).filter(l=>l.unit_id===unit.id).map(l=>l.id);return {...unit,lessonCount:ids.length,completedCount:ids.filter(id=>progress.some(p=>p.lesson_id===id&&p.status==='completed')).length};});
    setUnits(mapped);setLoading(false);
  }

  const m1=units.filter(unit=>unit.test_type==='M1');
  const completed=m1.reduce((sum,u)=>sum+u.completedCount,0);const total=m1.reduce((sum,u)=>sum+u.lessonCount,0);const progress=total?Math.round(completed/total*100):0;
  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white"><div className="mx-auto max-w-6xl"><LearningHeader />
  <section className="py-12"><p className="font-bold text-teal-300">Biblioteca de aprendizaje</p><h1 className="mt-2 max-w-4xl text-4xl font-black sm:text-6xl">Aprende la matemática que necesitas para resolver</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">Lecciones breves, ejemplos paso a paso, representaciones visuales, errores frecuentes y mini evaluaciones conectadas con tu banco de preguntas.</p>
  <div className="mt-9 grid gap-4 sm:grid-cols-4">{[["XP",stats.xp],["Nivel",stats.level],["Racha",`${stats.current_streak} días`],["Lecciones",`${completed}/${total}`]].map(([label,value])=><article key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-teal-300">{value}</p></article>)}</div>
  <article className="mt-6 rounded-3xl border border-indigo-300/20 bg-indigo-300/[0.05] p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-indigo-200">Progreso Matemática M1</p><p className="mt-2 text-sm text-slate-400">{completed} de {total} lecciones completadas</p></div><Link href="/ruta-estudio" className="rounded-xl bg-indigo-300 px-5 py-3 font-black text-slate-950">Ver ruta recomendada</Link></div><div className="mt-5"><ProgressBar value={progress} /></div></article>
  <div className="mt-10 grid gap-5 md:grid-cols-2">{m1.map(unit=>{const pct=unit.lessonCount?Math.round(unit.completedCount/unit.lessonCount*100):0;return <Link key={unit.id} href={`/aprender/m1/${unit.slug}`} className="group rounded-3xl border border-white/10 bg-white/[0.05] p-7 transition hover:-translate-y-1 hover:border-teal-300"><div className="flex items-start justify-between gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-teal-300/10 text-xl font-black text-teal-300">{unit.icon}</span><span className="text-sm font-bold text-slate-500">{unit.lessonCount} lecciones</span></div><h2 className="mt-6 text-2xl font-black group-hover:text-teal-200">{unit.title}</h2><p className="mt-3 leading-7 text-slate-400">{unit.description}</p><div className="mt-6"><ProgressBar value={pct} label={`${unit.completedCount} completadas`} /></div></Link>})}</div>
  <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7"><h2 className="text-2xl font-black">Matemática M2</h2><p className="mt-3 text-slate-400">La arquitectura ya está preparada para M2. Primero consolidaremos las 24 lecciones iniciales de M1 y luego publicaremos la extensión M2.</p></section>
  </section></div></main>;
}
