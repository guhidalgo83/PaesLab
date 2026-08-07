"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import VisualMathLab from "@/components/mathlabs/VisualMathLab";
import { getFifthGradeVisualLab } from "@/data/fifth-grade-visual-labs";
import { createClient } from "@/lib/supabase/client";
import type { VisualLabSaveResult } from "@/types/visual-lab";

export default function VisualLabPage() {
  const params = useParams();
  const labSlug = String(params.labSlug ?? "");
  const lab = getFifthGradeVisualLab(labSlug);
  const supabase = useMemo(() => createClient(), []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  async function save(score: number) {
    setSaving(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setMessage("Inicia sesión para guardar este resultado.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase.rpc("record_visual_lab_result", {
      p_lab_slug: labSlug,
      p_score: score,
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    const result = data as VisualLabSaveResult;
    setSaved(true);
    setMessage(result.completed ? `Laboratorio superado. Mejor puntaje: ${result.best_score}%.` : `Resultado guardado. Mejor puntaje: ${result.best_score}%.`);
    setSaving(false);
  }

  if (!lab) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
        <div className="text-center">
          <p className="text-5xl">🧪</p>
          <h1 className="mt-4 text-3xl font-black">Laboratorio no encontrado</h1>
          <Link href="/laboratorio/5-basico" className="mt-5 inline-block rounded-2xl bg-cyan-300 px-5 py-3 font-black text-slate-950">Ver laboratorios</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <Link href="/laboratorio/5-basico" className="text-sm font-black text-slate-400 hover:text-white">← Laboratorios visuales</Link>

        <div className={`mt-5 rounded-[2.75rem] border border-white/10 bg-gradient-to-br ${lab.gradient} p-7 sm:p-10`}>
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-100">{lab.chapter}</p>
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">{lab.title}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{lab.summary}</p>
            </div>
            <div className="grid h-28 w-28 place-items-center rounded-[2rem] border border-white/10 bg-slate-950/30 text-6xl">{lab.emoji}</div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={lab.lessonHref} className="rounded-2xl border border-white/15 px-5 py-3 text-center font-black text-white">Repasar la lección</Link>
            <Link href="/aventura/5-basico" className="rounded-2xl border border-white/15 px-5 py-3 text-center font-black text-white">Mapa de aventura</Link>
          </div>
        </div>

        <div className="mt-8">
          <VisualMathLab lab={lab} saving={saving} saved={saved} onSave={save} />
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4 text-sm font-bold text-cyan-100">
            {message}
          </div>
        ) : null}
      </section>
    </main>
  );
}
