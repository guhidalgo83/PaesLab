"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = { lessonId: string; topicSlug: string; userId: string | null; completed: boolean; onCompleted: () => void };

export default function SchoolLessonCompletion({ lessonId, topicSlug, userId, completed, onCompleted }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function finishLesson() {
    if (!userId) { setMessage("Inicia sesión para guardar esta lección."); return; }
    setSaving(true); setMessage("");
    const { error } = await supabase.rpc("complete_learning_lesson", { p_lesson_id: lessonId, p_quiz_score: null });
    if (error) setMessage(error.message); else { onCompleted(); setMessage("Lección registrada. Ahora practica para demostrar dominio."); }
    setSaving(false);
  }

  return (
    <section className="rounded-3xl border border-teal-300/20 bg-teal-300/[0.05] p-7">
      <p className="font-black text-teal-300">Siguiente paso</p>
      <h2 className="mt-2 text-2xl font-black">Consolida lo aprendido</h2>
      <p className="mt-3 leading-7 text-slate-400">Marcar la lectura registra avance inicial. La práctica segura actualizará tu dominio y tu ruta personalizada.</p>
      {message && <p className="mt-4 rounded-xl bg-white/10 p-3 text-sm text-slate-200">{message}</p>}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button disabled={saving || completed} onClick={() => void finishLesson()} className="rounded-xl border border-teal-300/30 px-5 py-3 font-black text-teal-200 disabled:opacity-50">
          {completed ? "✓ Lección estudiada" : saving ? "Guardando..." : "Marcar como estudiada"}
        </button>
        <Link href={`/practica-escolar/${topicSlug}`} className="rounded-xl bg-teal-300 px-5 py-3 text-center font-black text-slate-950">Practicar este tema →</Link>
      </div>
    </section>
  );
}
