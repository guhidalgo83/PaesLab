export type HubAxis = {
  axis_id: string;
  axis_name: string;
  axis_icon: string;
  mastery_percent: number;
  mastered_topics: number;
  total_topics: number;
};

export type HubPriorityTopic = {
  topic_id: string;
  topic_slug: string;
  topic_title: string;
  axis_name: string;
  mastery_percent: number;
  status: string;
  reason: string;
  priority: number;
  lesson_slug: string | null;
};

export type HubAction = {
  action_type: "lesson" | "practice" | "review" | "lab" | "diagnostic";
  title: string;
  description: string;
  href: string;
  emoji: string;
  priority: number;
};

export type HubRecentActivity = {
  kind: "practice" | "review" | "diagnostic" | "lesson" | "lab";
  title: string;
  score: number | null;
  happened_at: string;
};

export type LearningHubData = {
  course: {
    id: string;
    slug: string;
    name: string;
    short_name: string;
  };
  preferences: {
    weekly_goal: number;
    preferred_session_minutes: number;
    focus_mode: "balanced" | "reinforcement" | "challenge";
  };
  summary: {
    mastery_percent: number;
    mastered_topics: number;
    total_topics: number;
    lessons_completed: number;
    practice_sessions: number;
    practice_accuracy: number;
    questions_answered: number;
    labs_completed: number;
    labs_total: number;
    reviews_completed: number;
    latest_diagnostic_score: number | null;
    activities_this_week: number;
  };
  axes: HubAxis[];
  priority_topics: HubPriorityTopic[];
  next_actions: HubAction[];
  recent_activity: HubRecentActivity[];
};

export type ErrorNotebookItem = {
  source: "practice" | "diagnostic" | "review";
  source_label: string;
  answered_at: string;
  prompt: string;
  options: Array<{ id?: string; text?: string } | string>;
  selected_option: string;
  correct_option: string;
  explanation: string;
  topic_slug: string | null;
  topic_title: string | null;
  attempt_count: number;
};

export type AchievementUnlock = {
  achievement_code: string;
  unlocked_at: string;
};

export type AchievementDefinition = {
  code: string;
  emoji: string;
  title: string;
  description: string;
  group: "inicio" | "practica" | "dominio" | "visual" | "desafio";
};

export type LearningTrendPoint = {
  week_start: string;
  practice_sessions: number;
  average_score: number;
  questions_answered: number;
  lessons_completed: number;
  labs_completed: number;
};

export type LearningSessionItem = {
  position: number;
  action_type: "lesson" | "practice" | "review" | "lab" | "diagnostic";
  title: string;
  description: string;
  href: string;
  emoji: string;
  estimated_minutes: number;
  status: "pending" | "current" | "completed" | "skipped";
  completed_at: string | null;
};

export type LearningSession = {
  id: string;
  course_id: string;
  course_slug: string;
  course_name: string;
  target_minutes: number;
  status: "active" | "ready_to_complete";
  started_at: string;
  items: LearningSessionItem[];
};
