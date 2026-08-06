"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import { createClient } from "@/lib/supabase/client";
import type {
  DiagnosticCompletionResult,
  DiagnosticTopicResult,
} from "@/types/diagnostic";

const levelStyles: Record<DiagnosticTopicResult["level"], string> = {
  fortaleza: "border-emerald-300/25 bg-emerald-300/[0.05] text-emerald-200",
  en_desarrollo: "border-amber-300/25 bg-amber-300/[0.05] text-amber-200",
  prioridad: "border-rose-300/25 bg-rose-300/[0.05] text-rose-200",
};

const levelLabels: Record<DiagnosticTopicResult["level"], string> = {
  fortaleza: "Fortaleza inicial",
  en_desarrollo: "En desarrollo",
  prioridad: "Prioridad de refuerzo",
};

export default function DiagnosticResultPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const sessionId = String(params.sessionId ?? "");
  const [result, setResult] = useState<DiagnosticCompletionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadResult = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase.rpc("complete_school_diagnostic", {
      p_session_id: sessionId,
    });

    if (error || !data) {
      setMessage(error?.message ?? "No pudimos completar el diagnóstico.");
    } else {
      setResult(data as unknown as DiagnosticCompletionResult);
    }
    setLoading(false);
  }, [router, sessionId, supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadResult();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadResult]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        Analizando tus respuestas...
      </main>
    );
  }

  if (!result) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
        <section className="max-w-xl text-center">
          <h1 className="text-3xl font-black">No pudimos generar el informe</h1>
          <p className="mt-4 text-slate-400">{message}</p>
          <Link
            href={`/diagnostico-escolar/${sessionId}`}
            className="mt-6 inline-block rounded-xl bg-teal-300 px-5 py-3 font-black text-slate-950"
          >
            Volver al diagnóstico
          </Link>
        </section>
      </main>
    );
  }

  const topics = result.summary?.topics ?? [];
  const strengths = topics.filter((topic) => topic.level === "fortaleza");
  const priorities = topics.filter((topic) => topic.level === "prioridad");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="rounded-[2rem] border border-teal-300/20 bg-gradient-to-br from-teal-300/10 to-indigo-300/[0.04] p-7">
            <p className="font-black text-teal-300">Diagnóstico completado</p>
            <p className="mt-5 text-7xl font-black">{result.score_percent}%</p>
            <p className="mt-3 text-slate-400">
              {result.correct_answers} respuestas correctas de {result.total_questions}
            </p>

            <div className="mt-7 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <strong className="text-emerald-200">{strengths.length}</strong>
                <p className="mt-1 text-sm text-slate-400">fortalezas iniciales</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <strong className="text-rose-200">{priorities.length}</strong>
                <p className="mt-1 text-sm text-slate-400">prioridades de refuerzo</p>
              </div>
            </div>

            <div className="mt-7 grid gap-3">
              <Link
                href="/mi-ruta"
                className="rounded-xl bg-teal-300 px-5 py-3 text-center font-black text-slate-950"
              >
                Abrir mi ruta personalizada
              </Link>
              <Link
                href="/diagnostico-escolar"
                className="rounded-xl border border-white/15 px-5 py-3 text-center font-black"
              >
                Volver al diagnóstico
              </Link>
            </div>
          </aside>

          <section>
            <p className="font-black text-indigo-200">Informe por tema</p>
            <h1 className="mt-2 text-4xl font-black">Tu mapa inicial de aprendizaje</h1>
            <p className="mt-4 max-w-3xl leading-7 text-slate-400">
              Este resultado es una fotografía inicial. El dominio se ajustará a medida que
              estudies, practiques y vuelvas a demostrar lo aprendido.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {topics.map((topic) => (
                <article
                  key={topic.topic_id}
                  className={`rounded-3xl border p-5 ${levelStyles[topic.level]}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide opacity-80">
                        {topic.axis_name}
                      </p>
                      <h2 className="mt-2 text-lg font-black text-white">
                        {topic.topic_title}
                      </h2>
                    </div>
                    <strong className="text-2xl">{topic.score_percent}%</strong>
                  </div>
                  <p className="mt-4 text-sm font-black">
                    {levelLabels[topic.level]}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {topic.correct}/{topic.total} correctas · seguridad declarada {topic.confidence_percent}%
                  </p>
                  <Link
                    href={`/matematica/tema/${topic.topic_slug}`}
                    className="mt-4 inline-block text-sm font-black"
                  >
                    Revisar este tema →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
