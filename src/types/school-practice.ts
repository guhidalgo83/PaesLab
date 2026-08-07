export type SchoolPracticeOption = { id: "A" | "B" | "C" | "D"; text: string };
export type SchoolPracticeStart = { session_id: string; topic_id: string; topic_title: string; total_questions: number };
export type SchoolPracticeQuestion = {
  complete: boolean;
  session_id: string;
  item_id?: string;
  code?: string;
  prompt?: string;
  options?: SchoolPracticeOption[];
  difficulty?: string;
  skill?: string;
  position?: number;
  answered_questions?: number;
  total_questions?: number;
};
export type SchoolPracticeAnswer = {
  saved: boolean;
  already_answered?: boolean;
  is_correct?: boolean;
  correct_option?: string;
  explanation?: string;
  feedback?: string;
  answered_questions?: number;
  total_questions?: number;
};
export type SchoolPracticeCompletion = {
  session_id: string;
  completed: boolean;
  score_percent: number;
  correct_answers: number;
  total_questions: number;
  confidence_percent: number;
  mastery_percent: number;
  mastery_status: "learning" | "practicing" | "mastered";
};
