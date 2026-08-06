"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import { createClient } from "@/lib/supabase/client";

type DiagnosticItemAdmin = {
  id: string;
  code: string;
  topic_id: string;
  prompt: string;
  correct_option: string;
  difficulty: string;
  sort_order: number;
  is_published: boolean;
};

type TopicLite = { id: string; title: string };

type SessionLite = {
  id: string;
  status: string;
  score_percent: number;
  started_at: string;
};

export default function DiagnosticAdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<DiagnosticItemAdmin[]>([]);
  const [topics, setTopics] = useState<TopicLite[]>([]);
  const [sessions, setSessions] = useState<SessionLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/login");
      return;
    }

    const { data: isAdmin, error: adminError } = await supabase.rpc(
      "is_learning_admin",
    );
    if (adminError || !isAdmin) {
      router.replace("/dashboard");
      return;
    }

    const [itemResult, topicResult, sessionResult] = await Promise.all([
      supabase
        .from("school_diagnostic_items")
        .select("id,code,topic_id,prompt,correct_option,difficulty,sort_order,is_published")
        .order("sort_order"),
      supabase.from("knowledge_topics").select("id,title").eq("course_id", "cl-5-basico"),
      supabase
        .from("school_diagnostic_sessions")
        .select("id,status,score_percent,started_at")
        .order("started_at", { ascending: false })
        .limit(20),
    ]);

    setItems((itemResult.data ?? []) as unknown as DiagnosticItemAdmin[]);
    setTopics((topicResult.data ?? []) as unknown as TopicLite[]);
    setSessions((sessionResult.data ?? []) as unknown as SessionLite[]);
    setMessage(
      itemResult.error?.message ??
        topicResult.error?.message ??
        sessionResult.error?.message ??
        "",
    );
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function togglePublished(item: DiagnosticItemAdmin) {
    const { error } = await supabase
      .from("school_diagnostic_items")
      .update({ is_published: !item.is_published })
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
    } else {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, is_published: !entry.is_published }
            : entry,
        ),
      );
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        Cargando administración...
      </main>
    );
  }

  const completed = sessions.filter((session) => session.status === "completed");
  const average = completed.length
    ? Math.round(
        completed.reduce((sum, session) => sum + session.score_percent, 0) /
          completed.length,
      )
    : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-black text-indigo-200">Administración</p>
            <h1 className="mt-2 text-4xl font-black">Diagnóstico escolar</h1>
            <p className="mt-3 text-slate-400">
              Revisa preguntas publicadas y actividad reciente del diagnóstico.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-xl border border-white/15 px-5 py-3 font-black"
          >
            Volver al administrador
          </Link>
        </div>

        {message && (
          <p className="mt-6 rounded-xl bg-rose-300/10 p-4 text-rose-200">{message}</p>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-slate-400">Preguntas</p>
            <p className="mt-2 text-4xl font-black">{items.length}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-slate-400">Diagnósticos completados recientes</p>
            <p className="mt-2 text-4xl font-black">{completed.length}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-sm text-slate-400">Resultado promedio reciente</p>
            <p className="mt-2 text-4xl font-black">{average}%</p>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/[0.04] text-left text-slate-400">
              <tr>
                <th className="px-5 py-4">Orden</th>
                <th className="px-5 py-4">Código</th>
                <th className="px-5 py-4">Tema</th>
                <th className="px-5 py-4">Pregunta</th>
                <th className="px-5 py-4">Clave</th>
                <th className="px-5 py-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((item) => (
                <tr key={item.id} className="bg-slate-950/50">
                  <td className="px-5 py-4 font-bold">{item.sort_order}</td>
                  <td className="px-5 py-4 text-indigo-200">{item.code}</td>
                  <td className="px-5 py-4">
                    {topics.find((topic) => topic.id === item.topic_id)?.title ?? item.topic_id}
                  </td>
                  <td className="max-w-xl px-5 py-4 text-slate-300">{item.prompt}</td>
                  <td className="px-5 py-4 font-black text-emerald-200">
                    {item.correct_option}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => void togglePublished(item)}
                      className={`rounded-lg px-3 py-2 text-xs font-black ${
                        item.is_published
                          ? "bg-emerald-300/10 text-emerald-200"
                          : "bg-white/10 text-slate-400"
                      }`}
                    >
                      {item.is_published ? "Publicada" : "Oculta"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
