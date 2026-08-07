export type TestType = "M1" | "M2" | "SCHOOL";
export type Difficulty = "Básico" | "Medio" | "Avanzado";
export type LessonStatus = "not_started" | "in_progress" | "completed";

export type LearningUnit = {
  id: string;
  test_type: TestType;
  axis: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_published: boolean;
};

export type Lesson = {
  id: string;
  unit_id: string;
  slug: string;
  title: string;
  summary: string;
  objective: string;
  estimated_minutes: number;
  difficulty: Difficulty;
  sort_order: number;
  is_published: boolean;
  video_url: string | null;
  thumbnail_url: string | null;
  prerequisites: string[];
  tags: string[];
  question_filter: Record<string, unknown>;
};

export type LessonBlock = {
  id: string;
  lesson_id: string;
  block_type: string;
  title: string;
  content: string;
  data: Record<string, unknown>;
  sort_order: number;
};

export type LessonProgress = {
  lesson_id: string;
  status: LessonStatus;
  progress_percent: number;
  best_quiz_score: number | null;
  last_block_order: number;
};

export type LearningQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  visual_type: string | null;
  visual_data: Record<string, unknown> | null;
  image_url: string | null;
  image_alt: string | null;
};
