"use client";

import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import V22AdminNav from "@/components/mathlabs/V22AdminNav";
import {createClient} from "@/lib/supabase/client";
import type {V289Overview} from "@/types/expansion-6b-v289";

export default function Expansion6BV289(){
  const router=useRouter(); const supabase=useMemo(()=>createClient(),[]);
  const [data,setData]=useState<V289Overview|null>(null); const [error,setError]=useState("");
  useEffect(()=>{let cancelled=false;void(async()=>{
    const {data:auth}=await supabase.auth.getUser(); if(cancelled)return;
    if(!auth.user){router.replace("/login");return;}
    const {data:payload,error:e}=await supabase.rpc("get_v289_6b_expansion_overview");
    if(cancelled)return; if(e)setError(e.message);else setData(payload as V289Overview);
  })();return()=>{cancelled=true;};},[router,supabase]);
  return <main className="min-h-screen bg-slate-950 text-white"><MathLabsHeader/>
    <section className="mx-auto max-w-7xl px-5 py-10"><V22AdminNav/>
      <header className="mt-6 rounded-[2.5rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.15),transparent_38%),#0f172a] p-7 sm:p-10">
        <p className="text-xs font-black uppercase tracking-[.22em] text-cyan-200">v28.5 → v28.9 · 6.º básico REVIEWED RC2 · Contract-audited staging</p>
        <h1 className="mt-3 text-4xl font-black sm:text-6xl">6B RC2 auditable sobre la arquitectura multi-curso</h1>
        <p className="mt-4 max-w-4xl leading-7 text-slate-300">24 OA → 48 topics distintos → soluciones y contratos exactos → 1248 ítems → adaptación → diagnóstico 48/48 → rutas. Representaciones y laboratorios permanecen como especificaciones; Q4 DB provisional 78. Snapshot curricular 2026-08-12 y revalidación obligatoria antes de release.</p>
      </header>
      {error?<p className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4">{error}</p>:null}
      {!data?<p className="mt-6 text-slate-400">Cargando macrobloque 6B…</p>:<>
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-8">
          {[["OA",data.official_oas],["Topics",data.deep_topics],["Nodos",data.curriculum_nodes],["Practice",data.practice],["Diagnostic",data.diagnostic],["Review",data.review],["Auto gate",data.auto_gate_topics],["Publicados",data.published_assessment_items]].map(([l,v])=><div key={String(l)} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{l}</p><p className="mt-2 text-3xl font-black">{v}</p></div>)}
        </section>
        <section className="mt-4 grid gap-3 sm:grid-cols-4">
          {[["Microlecciones",data.micro_lessons],["Worked",data.worked_examples],["Guided",data.guided_practice],["Metadata",data.adaptive_metadata]].map(([l,v])=><div key={String(l)} className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[.04] p-5"><p className="text-xs font-black uppercase text-cyan-200">{l}</p><p className="mt-2 text-3xl font-black">{v}</p></div>)}
        </section>
        <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-5 text-sm leading-6 text-amber-50"><b>Gates deliberados:</b> revalidación curricular={String(data.curriculum_snapshot?.requires_revalidation_before_release ?? true)} · metadata calibrada={data.calibrated_metadata}/{data.adaptive_metadata} · certificaciones humanas={data.human_certified_topics} · release candidates={data.release_candidates} · live delivery={String(data.live_student_delivery)}.</div>
        <section className="mt-7 grid gap-3 lg:grid-cols-2">{data.topics.map(t=><article key={t.topic_id} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prioridad {t.priority}</p><h2 className="mt-1 font-black">{t.topic_id}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-black ${t.auto_gate?"bg-emerald-300/15 text-emerald-100":"bg-rose-300/10 text-rose-100"}`}>{t.auto_gate?"AUTO OK":"PRE-HUMAN BLOCKED"}</span></div><p className="mt-3 text-xs text-slate-400">{t.practice} practice · {t.diagnostic} diagnostic · {t.review} review · {t.metadata} metadata · Q4 {t.q4}</p><div className="mt-3 flex flex-wrap gap-2">{t.blockers.map(b=><span key={b} className="rounded-full bg-slate-800 px-3 py-1 text-[10px] font-black text-slate-300">{b}</span>)}</div></article>)}</section>
      </>}
    </section>
  </main>;
}
