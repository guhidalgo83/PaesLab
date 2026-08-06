"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import { createClient } from "@/lib/supabase/client";
import type {
  KnowledgeTopic,
  StudentSchoolProfile,
  StudentStudyEvent,
  StudyEventType,
} from "@/types/school";

const EVENT_TYPES: Array<{ id: StudyEventType; label: string }> = [
  { id: "test", label: "Prueba" },
  { id: "quiz", label: "Control" },
  { id: "homework", label: "Tarea" },
  { id: "guide", label: "Guía" },
  { id: "class_topic", label: "Contenido visto en clases" },
  { id: "other", label: "Otro" },
];

export default function StudyAgendaPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentSchoolProfile | null>(null);
  const [topics, setTopics] = useState<KnowledgeTopic[]>([]);
  const [events, setEvents] = useState<StudentStudyEvent[]>([]);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<StudyEventType>("test");
  const [eventDate, setEventDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadEvents(currentUserId: string) {
    const { data, error } = await supabase
      .from("student_study_events")
      .select("*")
      .eq("user_id", currentUserId)
      .neq("status", "cancelled")
      .order("event_date")
      .limit(50);
    if (error) setMessage(error.message);
    setEvents((data ?? []) as unknown as StudentStudyEvent[]);
  }

  async function initialize() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/login");
      return;
    }
    setUserId(authData.user.id);

    const { data: profileData, error: profileError } = await supabase
      .from("student_school_profiles")
      .select("*")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (!profileData) {
      if (profileError) setMessage(profileError.message);
      router.replace("/configurar-perfil");
      return;
    }

    const loadedProfile = profileData as unknown as StudentSchoolProfile;
    setProfile(loadedProfile);

    const { data: topicData, error: topicError } = await supabase
      .from("knowledge_topics")
      .select("*")
      .eq("course_id", loadedProfile.course_id)
      .eq("is_published", true)
      .order("sort_order");

    if (topicError) setMessage(topicError.message);
    setTopics((topicData ?? []) as unknown as KnowledgeTopic[]);
    await loadEvents(authData.user.id);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initialize();
  }, []);

  function toggleTopic(topicId: string) {
    setSelectedTopicIds((current) =>
      current.includes(topicId)
        ? current.filter((id) => id !== topicId)
        : [...current, topicId],
    );
  }

  async function addEvent() {
    if (!userId || !profile || !title.trim() || !eventDate) {
      setMessage("Completa el título y la fecha.");
      return;
    }

    setSaving(true);
    setMessage("");
    const { data: created, error } = await supabase
      .from("student_study_events")
      .insert({
        user_id: userId,
        school_id: profile.school_id,
        course_id: profile.course_id,
        title: title.trim(),
        event_type: eventType,
        event_date: eventDate,
        notes: notes.trim(),
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !created) {
      setMessage(error?.message ?? "No pudimos guardar la actividad.");
      setSaving(false);
      return;
    }

    if (selectedTopicIds.length > 0) {
      const { error: linkError } = await supabase
        .from("student_event_topics")
        .insert(selectedTopicIds.map((topicId) => ({ event_id: created.id, topic_id: topicId })));
      if (linkError) setMessage(linkError.message);
    }

    setTitle("");
    setEventType("test");
    setEventDate("");
    setNotes("");
    setSelectedTopicIds([]);
    await loadEvents(userId);
    setSaving(false);
  }

  async function setEventStatus(eventId: string, status: "completed" | "cancelled") {
    const { error } = await supabase
      .from("student_study_events")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", eventId);
    if (error) setMessage(error.message);
    if (userId) await loadEvents(userId);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-black text-amber-300">Organización personal</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">Agenda de estudio</h1>
            <p className="mt-4 max-w-3xl leading-7 text-slate-400">
              Registra pruebas, guías y contenidos vistos en clases. Los temas seleccionados pasarán a tus recomendaciones de estudio.
            </p>
          </div>
          <Link href="/mi-colegio" className="rounded-xl border border-white/15 px-5 py-3 font-black">
            Volver a mi espacio
          </Link>
        </div>

        {message && <p className="mt-6 rounded-xl bg-rose-300/10 p-4 text-rose-200">{message}</p>}

        {loading ? (
          <p className="mt-10 text-slate-400">Cargando agenda...</p>
        ) : (
          <div className="mt-10 grid gap-7 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <h2 className="text-2xl font-black">Agregar actividad</h2>
              <div className="mt-6 space-y-4">
                <label className="block text-sm font-bold text-slate-300">
                  Tipo
                  <select value={eventType} onChange={(event) => setEventType(event.target.value as StudyEventType)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
                    {EVENT_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-bold text-slate-300">
                  Título
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej.: Prueba de fracciones" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
                </label>
                <label className="block text-sm font-bold text-slate-300">
                  Fecha
                  <input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
                </label>
                <label className="block text-sm font-bold text-slate-300">
                  Notas, opcional
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Contenidos indicados por el profesor..." className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
                </label>
              </div>

              <div className="mt-6">
                <p className="text-sm font-black text-teal-200">Temas relacionados</p>
                <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {topics.map((topic) => (
                    <label key={topic.id} className="flex cursor-pointer gap-3 rounded-xl border border-white/10 bg-slate-950/35 p-3">
                      <input type="checkbox" checked={selectedTopicIds.includes(topic.id)} onChange={() => toggleTopic(topic.id)} className="mt-1" />
                      <span>
                        <strong className="block text-sm">{topic.title}</strong>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{topic.summary}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="button" disabled={saving} onClick={() => void addEvent()} className="mt-6 w-full rounded-xl bg-amber-300 px-5 py-4 font-black text-slate-950 disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar en mi agenda"}
              </button>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
              <h2 className="text-2xl font-black">Mis actividades</h2>
              <div className="mt-6 space-y-4">
                {events.map((event) => (
                  <article key={event.id} className={`rounded-2xl border p-5 ${event.status === "completed" ? "border-emerald-300/20 bg-emerald-300/[0.04]" : "border-white/10 bg-slate-950/40"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-amber-200">{EVENT_TYPES.find((item) => item.id === event.event_type)?.label ?? "Actividad"}</p>
                        <h3 className="mt-1 text-lg font-black">{event.title}</h3>
                      </div>
                      <time className="rounded-lg bg-white/10 px-3 py-1 text-sm font-bold text-slate-300">{event.event_date}</time>
                    </div>
                    {event.notes && <p className="mt-3 text-sm leading-6 text-slate-400">{event.notes}</p>}
                    <div className="mt-4 flex flex-wrap gap-3">
                      {event.status !== "completed" && (
                        <button type="button" onClick={() => void setEventStatus(event.id, "completed")} className="rounded-xl bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950">
                          Marcar completada
                        </button>
                      )}
                      <button type="button" onClick={() => void setEventStatus(event.id, "cancelled")} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-black text-slate-300">
                        Quitar
                      </button>
                    </div>
                  </article>
                ))}
                {events.length === 0 && <p className="rounded-2xl border border-white/10 p-5 text-slate-400">Tu agenda todavía está vacía.</p>}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
