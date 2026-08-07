"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import MathLabsGuide from "@/components/mathlabs/MathLabsGuide";
import SchoolReviewQuestionCard from "@/components/mathlabs/SchoolReviewQuestionCard";
import { createClient } from "@/lib/supabase/client";
import type {
  SchoolReviewAnswer,
  SchoolReviewCompletion,
  SchoolReviewQuestion,
  SchoolReviewSet,
  SchoolReviewStart,
} from "@/types/school-review";

function achievement(score: number) {
  if (score >= 90) return { icon: "🏆", title: "Maestro del Tomo 1", message: "Tu dominio es excelente. Puedes avanzar con mucha confianza." };
  if (score >= 70) return { icon: "🌟", title: "Gran explorador", message: "Vas muy bien. Revisa las preguntas incorrectas y vuelve a intentar." };
  if (score >= 50) return { icon: "🧭", title: "Aventura en progreso", message: "Ya tienes una base. Conviene repasar algunas misiones antes de repetir el desafío." };
  return { icon: "🧩", title: "Primera expedición", message: "Cada error muestra qué tema conviene estudiar. Vuelve al mapa y avanza paso a paso." };
}

export default function SchoolReviewPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const reviewSlug = String(params.reviewSlug ?? "");
  const [review, setReview] = useState<SchoolReviewSet | null>(null);
  const [session, setSession] = useState<SchoolReviewStart | null>(null);
  const [question, setQuestion] = useState<SchoolReviewQuestion | null>(null);
  const [selected, setSelected] = useState("");
  const [confidence, setConfidence] = useState("unsure");
  const [answer, setAnswer] = useState<SchoolReviewAnswer | null>(null);
  const [completion, setCompletion] = useState<SchoolReviewCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const startedAt = useRef<number | null>(null);

  const initialize = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("school_review_sets")
      .select("*")
      .eq("slug", reviewSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) {
      setMessage(error?.message ?? "Desafío no encontrado.");
    } else {
      setReview(data as unknown as SchoolReviewSet);
    }
    setLoading(false);
  }, [reviewSlug, router, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void initialize();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialize]);

  async function loadQuestion(sessionId: string) {
    setBusy(true);
    const { data, error } = await supabase.rpc("get_school_review_question", {
      p_session_id: sessionId,
    });

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    const payload = data as SchoolReviewQuestion;
    if (payload.complete) {
      const done = await supabase.rpc("complete_school_review", {
        p_session_id: sessionId,
      });
      if (done.error) {
        setMessage(done.error.message);
      } else {
        setCompletion(done.data as SchoolReviewCompletion);
      }
      setQuestion(null);
    } else {
      setQuestion(payload);
      setSelected("");
      setConfidence("unsure");
      setAnswer(null);
      startedAt.current = Date.now();
    }
    setBusy(false);
  }

  async function start() {
    setBusy(true);
    setMessage("");
    const { data, error } = await supabase.rpc("start_school_review", {
      p_review_slug: reviewSlug,
      p_question_count: 12,
    });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }
    const created = data as SchoolReviewStart;
    setSession(created);
    setBusy(false);
    await loadQuestion(created.session_id);
  }

  async function submit() {
    if (!session || !question?.item_id || !selected) return;
    setBusy(true);
    const now = Date.now();
    const seconds = Math.max(
      0,
      Math.round((now - (startedAt.current ?? now)) / 1000),
    );
    const { data, error } = await supabase.rpc(
      "submit_school_review_answer",
      {
        p_session_id: session.session_id,
        p_item_id: question.item_id,
        p_selected_option: selected,
        p_confidence_level: confidence,
        p_time_seconds: seconds,
      },
    );
    if (error) setMessage(error.message);
    else setAnswer(data as SchoolReviewAnswer);
    setBusy(false);
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        Preparando el gran desafío...
      </main>
    );
  }

  const badge = completion ? achievement(completion.score_percent) : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-5xl px-5 py-12">
        <Link href="/aventura/5-basico" className="text-sm font-bold text-slate-400">
          ← Volver al mapa
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="font-black uppercase tracking-[0.2em] text-cyan-200">
              Repaso seguro · 5° básico
            </p>
            <h1 className="mt-3 text-4xl font-black sm:text-6xl">
              {review?.title ?? "Gran desafío"}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
              {review?.description}
            </p>
          </div>
          <MathLabsGuide
            compact
            message="Responderás 12 preguntas mezcladas. Después de cada intento recibirás una explicación y al final obtendrás una insignia."
          />
        </div>

        {message ? (
          <p className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-rose-100">
            {message}
          </p>
        ) : null}

        {!session && !completion ? (
          <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                ["12", "preguntas"],
                ["4", "habilidades"],
                ["1", "insignia final"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-center">
                  <p className="text-4xl font-black text-cyan-200">{value}</p>
                  <p className="mt-2 text-sm text-slate-400">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 leading-7 text-slate-300">
              Las respuestas correctas permanecen protegidas en Supabase y solo se revelan después de cada intento.
            </p>
            <button
              type="button"
              disabled={busy || !review}
              onClick={() => void start()}
              className="mt-6 w-full rounded-2xl bg-cyan-300 px-6 py-4 font-black text-slate-950 disabled:opacity-50"
            >
              {busy ? "Preparando preguntas..." : "Comenzar el desafío"}
            </button>
          </section>
        ) : null}

        {question ? (
          <div className="mt-10">
            <SchoolReviewQuestionCard
              question={question}
              selected={selected}
              confidence={confidence}
              answer={answer}
              busy={busy}
              onSelect={setSelected}
              onConfidence={setConfidence}
              onSubmit={() => void submit()}
              onNext={() => session && void loadQuestion(session.session_id)}
            />
          </div>
        ) : null}

        {completion && badge ? (
          <section className="mt-10 overflow-hidden rounded-[2.5rem] border border-emerald-300/20 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.16),transparent_40%),linear-gradient(135deg,#0f172a,#020617)] p-8 text-center sm:p-10">
            <div className="text-7xl">{badge.icon}</div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-emerald-200">
              Desafío completado
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">{badge.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">
              {badge.message}
            </p>
            <p className="mt-6 text-8xl font-black text-cyan-200">
              {completion.score_percent}%
            </p>
            <p className="mt-2 text-slate-400">
              {completion.correct_answers} correctas de {completion.total_questions}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setSession(null);
                  setCompletion(null);
                }}
                className="rounded-xl border border-white/15 px-5 py-3 font-black"
              >
                Intentar nuevamente
              </button>
              <Link
                href="/aventura/5-basico"
                className="rounded-xl bg-white px-5 py-3 font-black text-slate-950"
              >
                Volver al mapa
              </Link>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
