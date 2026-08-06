"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import { createClient } from "@/lib/supabase/client";
import type {
  Course,
  KnowledgeTopic,
  SchoolDirectoryEntry,
  StudentSchoolProfile,
  StudentStudyEvent,
  StudentTopicMastery,
} from "@/types/school";

const EVENT_LABELS: Record<string, string> = {
  test: "Prueba",
  quiz: "Control",
  homework: "Tarea",
  guide: "Guía",
  class_topic: "Contenido de clases",
  other: "Otro",
};

export default function MySchoolPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [course, setCourse] = useState<Course | null>(null);
  const [school, setSchool] = useState<SchoolDirectoryEntry | null>(null);
  const [profile, setProfile] = useState<StudentSchoolProfile | null>(null);
  const [events, setEvents] = useState<StudentStudyEvent[]>([]);
  const [topics, setTopics] = useState<KnowledgeTopic[]>([]);
  const [recommended, setRecommended] = useState<KnowledgeTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function initialize() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/login");
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("student_school_profiles")
      .select("*")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    if (!profileData) {
      router.replace("/configurar-perfil");
      return;
    }

    const loadedProfile = profileData as unknown as StudentSchoolProfile;
    setProfile(loadedProfile);

    const today = new Date().toISOString().slice(0, 10);
    const [courseResult, schoolResult, eventResult, topicResult] = await Promise.all([
      supabase.from("courses").select("*").eq("id", loadedProfile.course_id).maybeSingle(),
      loadedProfile.school_id
        ? supabase.from("school_directory").select("*").eq("id", loadedProfile.school_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("student_study_events")
        .select("*")
        .eq("user_id", authData.user.id)
        .eq("status", "pending")
        .gte("event_date", today)
        .order("event_date")
        .limit(8),
      supabase
        .from("knowledge_topics")
        .select("*")
        .eq("course_id", loadedProfile.course_id)
        .eq("is_published", true)
        .order("sort_order"),
    ]);

    const loadedCourse = courseResult.data as unknown as Course | null;
    const loadedSchool = schoolResult.data as unknown as SchoolDirectoryEntry | null;
    const loadedEvents = (eventResult.data ?? []) as unknown as StudentStudyEvent[];
    const loadedTopics = (topicResult.data ?? []) as unknown as KnowledgeTopic[];

    setCourse(loadedCourse);
    setSchool(loadedSchool);
    setEvents(loadedEvents);
    setTopics(loadedTopics);

    const eventIds = loadedEvents.map((event) => event.id);
    const eventTopicIds: string[] = [];
    if (eventIds.length > 0) {
      const { data: links } = await supabase
        .from("student_event_topics")
        .select("event_id,topic_id")
        .in("event_id", eventIds);
      for (const link of links ?? []) {
        if (!eventTopicIds.includes(link.topic_id)) eventTopicIds.push(link.topic_id);
      }
    }

    const fromAgenda = eventTopicIds
      .map((id) => loadedTopics.find((topic) => topic.id === id))
      .filter((topic): topic is KnowledgeTopic => Boolean(topic));

    if (fromAgenda.length > 0) {
      setRecommended(fromAgenda.slice(0, 4));
    } else if (loadedTopics.length > 0) {
      const topicIds = loadedTopics.map((topic) => topic.id);
      const { data: masteryData } = await supabase
        .from("student_topic_mastery")
        .select("*")
        .eq("user_id", authData.user.id)
        .in("topic_id", topicIds);
      const mastery = (masteryData ?? []) as unknown as StudentTopicMastery[];
      const ranked = [...loadedTopics].sort((a, b) => {
        const aValue = mastery.find((item) => item.topic_id === a.id)?.mastery_percent ?? 0;
        const bValue = mastery.find((item) => item.topic_id === b.id)?.mastery_percent ?? 0;
        return aValue - bValue || a.sort_order - b.sort_order;
      });
      setRecommended(ranked.slice(0, 4));
    }

    const firstError = courseResult.error ?? schoolResult.error ?? eventResult.error ?? topicResult.error;
    if (firstError) setMessage(firstError.message);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void initialize();
  }, []);

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 text-white">Cargando tu espacio...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader />
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-black text-sky-300">Mi contexto escolar</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              {school?.name ?? "Mi ruta MathLabs"}
            </h1>
            <p className="mt-4 text-lg text-slate-400">
              {course?.name ?? "Curso sin configurar"}
              {school ? ` · ${school.commune}, ${school.region}` : " · Sin colegio seleccionado"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/configurar-perfil" className="rounded-xl border border-white/15 px-5 py-3 font-black">
              Editar perfil
            </Link>
            <Link href="/agenda-estudio" className="rounded-xl bg-amber-300 px-5 py-3 font-black text-slate-950">
              Agregar prueba o tema
            </Link>
          </div>
        </div>

        {school && (
          <p className="mt-7 rounded-2xl border border-sky-300/15 bg-sky-300/[0.05] p-5 text-sm leading-6 text-slate-300">
            {school.verification_status === "verified"
              ? "Este establecimiento está verificado en el directorio de MathLabs."
              : "El nombre del colegio fue aportado por la comunidad. Las recomendaciones provienen de tu curso, tu agenda y tu progreso; no representan una planificación oficial del establecimiento."}
          </p>
        )}

        {message && <p className="mt-6 rounded-xl bg-rose-300/10 p-4 text-rose-200">{message}</p>}

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-black text-teal-300">Recomendado para revisar</p>
                <h2 className="mt-2 text-2xl font-black">Tu siguiente foco</h2>
              </div>
              <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-slate-300">
                {events.length > 0 ? "Según tu agenda" : "Según tu progreso"}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {recommended.map((topic, index) => (
                <article key={topic.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                  <div className="flex gap-4">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-teal-300/10 font-black text-teal-200">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-black">{topic.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{topic.summary}</p>
                      <Link href={`/matematica/tema/${topic.slug}`} className="mt-3 inline-block text-sm font-black text-indigo-200">
                        Abrir materiales →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
              {recommended.length === 0 && (
                <p className="rounded-2xl border border-white/10 p-5 text-slate-400">
                  Todavía no hay temas disponibles para este curso.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="font-black text-amber-300">Próximas actividades</p>
            <h2 className="mt-2 text-2xl font-black">Agenda de estudio</h2>
            <div className="mt-6 space-y-3">
              {events.map((event) => (
                <article key={event.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-amber-200">{EVENT_LABELS[event.event_type] ?? "Actividad"}</p>
                      <h3 className="mt-1 font-black">{event.title}</h3>
                    </div>
                    <time className="text-sm font-bold text-slate-400">{event.event_date}</time>
                  </div>
                  {event.notes && <p className="mt-3 text-sm leading-6 text-slate-400">{event.notes}</p>}
                </article>
              ))}
              {events.length === 0 && (
                <p className="rounded-2xl border border-white/10 p-5 text-sm leading-6 text-slate-400">
                  Agrega una prueba, guía o contenido visto en clases para que MathLabs priorice los temas correctos.
                </p>
              )}
            </div>
            <Link href="/agenda-estudio" className="mt-5 inline-block rounded-xl border border-white/15 px-4 py-3 text-sm font-black">
              Administrar agenda →
            </Link>
          </section>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Link href={course ? `/matematica/${course.slug}` : "/matematica"} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="font-black text-teal-300">Ruta del curso</p>
            <p className="mt-3 leading-7 text-slate-400">Revisa todos los objetivos y temas de tu nivel.</p>
          </Link>
          <Link href="/aprender" className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="font-black text-indigo-300">Lecciones</p>
            <p className="mt-3 leading-7 text-slate-400">Estudia explicaciones, ejemplos y práctica guiada.</p>
          </Link>
          <Link href="/mi-plan" className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <p className="font-black text-amber-300">Mi plan</p>
            <p className="mt-3 leading-7 text-slate-400">Recupera brechas detectadas en tus ejercicios.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
