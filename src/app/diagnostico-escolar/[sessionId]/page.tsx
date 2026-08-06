"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MathLabsHeader from "@/components/mathlabs/MathLabsHeader";
import DiagnosticQuestionCard from "@/components/mathlabs/DiagnosticQuestionCard";
import { createClient } from "@/lib/supabase/client";
import type {
  DiagnosticAnswerResult,
  DiagnosticQuestionPayload,
} from "@/types/diagnostic";

export default function DiagnosticRunnerPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const sessionId = String(params.sessionId ?? "");
  const [question, setQuestion] = useState<DiagnosticQuestionPayload | null>(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [confidence, setConfidence] = useState("unsure");
  const [answerResult, setAnswerResult] = useState<DiagnosticAnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const questionStartedAt = useRef<number | null>(null);

  const loadQuestion = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase.rpc("get_school_diagnostic_question", {
      p_session_id: sessionId,
    });

    if (error || !data) {
      setMessage(error?.message ?? "No pudimos cargar la pregunta.");
      setLoading(false);
      return;
    }

    const payload = data as unknown as DiagnosticQuestionPayload;
    if (payload.complete) {
      router.replace(`/diagnostico-escolar/${sessionId}/resultado`);
      return;
    }

    setQuestion(payload);
    setSelectedOption("");
    setConfidence("unsure");
    setAnswerResult(null);
    questionStartedAt.current = Date.now();
    setLoading(false);
  }, [router, sessionId, supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadQuestion();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadQuestion]);

  async function submitAnswer() {
    if (!question?.item_id || !selectedOption) return;
    setSubmitting(true);
    setMessage("");

    const startedAt = questionStartedAt.current ?? Date.now();
    const seconds = Math.max(
      0,
      Math.round((Date.now() - startedAt) / 1000),
    );

    const { data, error } = await supabase.rpc("submit_school_diagnostic_answer", {
      p_session_id: sessionId,
      p_item_id: question.item_id,
      p_selected_option: selectedOption,
      p_confidence_level: confidence,
      p_response_seconds: seconds,
    });

    if (error || !data) {
      setMessage(error?.message ?? "No pudimos guardar la respuesta.");
    } else {
      setAnswerResult(data as unknown as DiagnosticAnswerResult);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        Cargando pregunta...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MathLabsHeader compact />
      <section className="mx-auto max-w-4xl px-5 py-10">
        {message && (
          <p className="mb-6 rounded-xl bg-rose-300/10 p-4 text-rose-200">
            {message}
          </p>
        )}
        {question && (
          <DiagnosticQuestionCard
            question={question}
            selectedOption={selectedOption}
            confidence={confidence}
            answerResult={answerResult}
            submitting={submitting}
            onSelect={setSelectedOption}
            onConfidence={setConfidence}
            onSubmit={() => void submitAnswer()}
            onNext={() => void loadQuestion()}
          />
        )}
      </section>
    </main>
  );
}
