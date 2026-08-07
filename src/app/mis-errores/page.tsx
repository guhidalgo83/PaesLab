"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import { createClient } from "@/lib/supabase/client";
import type { ErrorNotebookItem } from "@/types/learning-os";

function optionText(options: ErrorNotebookItem["options"], optionId: string) {
  const match = options.find((option) => {
    if (typeof option === "string") return false;
    return option.id === optionId;
  });
  if (typeof match === "object" && match) return match.text ?? optionId;
  return optionId;
}

export default function ErrorNotebookPage() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<ErrorNotebookItem[]>([]);
  const [source, setSource] = useState<"all" | ErrorNotebookItem["source"]>("all");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_my_error_notebook", { p_limit: 80 });
    if (error) {
      setMessage(error.message);
      return;
    }
    setItems((data ?? []) as ErrorNotebookItem[]);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = source === "all" ? items : items.filter((item) => item.source === source);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <Link href="/hoy" className="text-sm font-black text-slate-400">← Mi centro MathLabs</Link>
        <div className="mt-5 rounded-[2.5rem] border border-rose-300/15 bg-[radial-gradient(circle_at_top_right,rgba(251,113,133,0.12),transparent_30%),rgba(255,255,255,0.025)] p-7 sm:p-9">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-200">Aprender del error</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Mi cuaderno de errores</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Guarda tus respuestas incorrectas para revisarlas con calma. Equivocarse aquí no resta: muestra exactamente qué conviene practicar.
          </p>
        </div>

        {message ? <p className="mt-6 rounded-2xl bg-rose-300/10 p-4 text-rose-100">{message}</p> : null}

        <div className="mt-7 flex flex-wrap gap-2">
          {[
            ["all", "Todos"],
            ["practice", "Práctica"],
            ["diagnostic", "Diagnóstico"],
            ["review", "Repasos"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSource(value as typeof source)}
              className={`rounded-xl px-4 py-2 text-sm font-black ${source === value ? "bg-rose-300 text-slate-950" : "border border-white/10 text-slate-300"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-7 space-y-5">
          {filtered.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 text-center">
              <p className="text-5xl">✨</p>
              <h2 className="mt-4 text-2xl font-black">No hay errores en esta categoría</h2>
              <p className="mt-2 text-sm text-slate-500">Cuando una respuesta no resulte, aparecerá aquí para que puedas revisarla.</p>
            </div>
          ) : filtered.map((item, index) => (
            <article key={`${item.source}-${item.answered_at}-${index}`} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-xl bg-rose-300/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-rose-200">{item.source_label}</span>
                {item.topic_title ? <span className="rounded-xl bg-white/5 px-3 py-1 text-xs font-black text-slate-400">{item.topic_title}</span> : null}
                {item.attempt_count > 1 ? <span className="rounded-xl bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-200">{item.attempt_count} errores registrados</span> : null}
              </div>

              <h2 className="mt-4 text-lg font-black leading-8 text-white">{item.prompt}</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.05] p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-rose-200">Tu respuesta</p>
                  <p className="mt-2 font-bold text-slate-200">{item.selected_option}. {optionText(item.options, item.selected_option)}</p>
                </div>
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.05] p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-200">Respuesta correcta</p>
                  <p className="mt-2 font-bold text-slate-200">{item.correct_option}. {optionText(item.options, item.correct_option)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-950/40 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-cyan-200">Por qué</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">{item.explanation || "Revisa el procedimiento del tema y vuelve a intentarlo."}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.topic_slug ? (
                  <>
                    <Link href={`/matematica/tema/${item.topic_slug}`} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black">Revisar tema</Link>
                    <Link href={`/practica-escolar/${item.topic_slug}`} className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950">Volver a practicar</Link>
                  </>
                ) : (
                  <Link href="/aventura/5-basico" className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black">Volver a la aventura</Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
