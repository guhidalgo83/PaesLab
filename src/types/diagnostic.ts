export type DiagnosticOption = {
  id: "A" | "B" | "C" | "D";
  text: string;
};

export type DiagnosticStartResult = {
  session_id: string;
  course_id: string;
  total_questions: number;
  diagnostic_version: string;
};

export type DiagnosticQuestionPayload = {
  complete: boolean;
  session_id: string;
  item_id?: string;
  code?: string;
  prompt?: string;
  options?: DiagnosticOption[];
  difficulty?: string;
  topic_id?: string;
  topic_title?: string;
  position?: number;
  answered_questions: number;
  total_questions: number;
};

export type DiagnosticAnswerResult = {
  saved: boolean;
  already_answered: boolean;
  selected_option: string;
  is_correct: boolean;
  correct_option: string;
  explanation: string;
  feedback: string;
  answered_questions?: number;
};

export type DiagnosticTopicResult = {
  topic_id: string;
  topic_slug: string;
  topic_title: string;
  axis_name: string;
  correct: number;
  total: number;
  score_percent: number;
  confidence_percent: number;
  level: "fortaleza" | "en_desarrollo" | "prioridad";
};

export type DiagnosticSummary = {
  course_id: string;
  diagnostic_version: string;
  score_percent: number;
  topics: DiagnosticTopicResult[];
  completed_at: string;
};

export type DiagnosticCompletionResult = {
  session_id: string;
  completed: boolean;
  score_percent: number;
  correct_answers: number;
  total_questions: number;
  summary: DiagnosticSummary;
};

export type StudyRecommendationStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "dismissed";

export type StudyRecommendation = {
  id: string;
  user_id: string;
  course_id: string;
  topic_id: string;
  source_type: "diagnostic" | "agenda" | "mastery" | "manual";
  source_session_id: string | null;
  reason: string;
  priority: number;
  status: StudyRecommendationStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};
