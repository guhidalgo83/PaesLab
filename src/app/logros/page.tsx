"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import AchievementsGrid from "@/components/mathlabs/AchievementsGrid";
import { achievementDefinitions } from "@/components/mathlabs/achievement-definitions";
import { createClient } from "@/lib/supabase/client";
import type { AchievementUnlock } from "@/types/learning-os";

export default function AchievementsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [unlocks, setUnlocks] = useState<AchievementUnlock[]>([]);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("refresh_my_achievements");
    if (error) {
      setMessage(error.message);
      return;
    }
    setUnlocks((data ?? []) as AchievementUnlock[]);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <Link href="/hoy" className="text-sm font-black text-slate-400">← Mi centro MathLabs</Link>
        <div className="mt-5 flex flex-col gap-6 rounded-[2.5rem] border border-amber-300/15 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.13),transparent_30%),rgba(255,255,255,0.025)] p-7 sm:p-9 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-200">Hitos de aprendizaje</p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">Mis logros</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">Los logros reconocen avance real: aprender, practicar, dominar y completar desafíos.</p>
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/35 p-5 text-center">
            <p className="text-4xl font-black text-amber-200">{unlocks.length}/{achievementDefinitions.length}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">desbloqueados</p>
          </div>
        </div>

        {message ? <p className="mt-6 rounded-2xl bg-rose-300/10 p-4 text-rose-100">{message}</p> : null}
        <div className="mt-8"><AchievementsGrid unlocks={unlocks} /></div>
      </section>
    </main>
  );
}
