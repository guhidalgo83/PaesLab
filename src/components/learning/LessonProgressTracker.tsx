"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LessonProgressTrackerProps = {
  userId: string | null;
  lessonId: string;
  initialProgress: number;
  completed: boolean;
};

export default function LessonProgressTracker({
  userId,
  lessonId,
  initialProgress,
  completed,
}: LessonProgressTrackerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [progress, setProgress] = useState(
    completed ? 100 : Math.max(10, initialProgress),
  );
  const lastSavedRef = useRef(
    completed ? 100 : Math.max(10, initialProgress),
  );
  const savingRef = useRef(false);

  useEffect(() => {
    if (!userId || completed) return;

    void saveProgress(Math.max(10, initialProgress));

    let scheduled = false;

    function handleScroll() {
      if (scheduled) return;
      scheduled = true;

      window.requestAnimationFrame(() => {
        scheduled = false;

        const root = document.documentElement;
        const available = root.scrollHeight - window.innerHeight;
        const raw =
          available > 0
            ? Math.round((window.scrollY / available) * 100)
            : 10;

        // El 100% queda reservado para completar la mini evaluación.
        const nextProgress = Math.max(
          10,
          Math.min(90, Math.round(raw / 10) * 10),
        );

        setProgress((current) =>
          nextProgress > current ? nextProgress : current,
        );

        if (nextProgress >= lastSavedRef.current + 10) {
          void saveProgress(nextProgress);
        }
      });
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [userId, lessonId, completed, initialProgress]);

  useEffect(() => {
    if (completed) {
      setProgress(100);
      lastSavedRef.current = 100;
    }
  }, [completed]);

  async function saveProgress(value: number) {
    if (
      !userId ||
      completed ||
      savingRef.current ||
      value <= lastSavedRef.current
    ) {
      return;
    }

    savingRef.current = true;

    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          status: "in_progress",
          progress_percent: value,
          last_block_order: Math.floor(value / 10),
          started_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      );

    if (!error) {
      lastSavedRef.current = value;

      await supabase
        .from("study_plan_items")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("lesson_id", lessonId)
        .eq("status", "pending");
    }

    savingRef.current = false;
  }

  return (
    <div className="sticky top-0 z-20 -mx-5 border-b border-white/10 bg-slate-950/95 px-5 py-3 backdrop-blur sm:rounded-b-2xl">
      <div className="mx-auto flex max-w-4xl items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-300 to-indigo-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-12 text-right text-sm font-black text-teal-300">
          {progress}%
        </span>
      </div>
    </div>
  );
}
