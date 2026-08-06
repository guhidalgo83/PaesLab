export type EducationLevel = {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

export type Course = {
  id: string;
  level_id: string;
  slug: string;
  name: string;
  short_name: string;
  grade_number: number;
  country_code: string;
  curriculum_version: string;
  curriculum_source_url: string | null;
  description: string;
  sort_order: number;
  is_available: boolean;
  is_published: boolean;
};

export type CurriculumAxis = {
  id: string;
  course_id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  is_published: boolean;
};

export type CurriculumObjective = {
  id: string;
  course_id: string;
  axis_id: string;
  code: string;
  title: string;
  summary: string;
  official_source_url: string | null;
  sort_order: number;
  is_published: boolean;
};

export type KnowledgeTopic = {
  id: string;
  course_id: string;
  axis_id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: "Inicial" | "Fundamental" | "Intermedio" | "Avanzado";
  estimated_minutes: number;
  sort_order: number;
  content_status: "mapped" | "draft" | "review" | "published";
  is_published: boolean;
};

export type StudentTopicMastery = {
  user_id: string;
  topic_id: string;
  mastery_percent: number;
  confidence_percent: number;
  attempts_count: number;
  correct_count: number;
  status: "not_started" | "learning" | "practicing" | "mastered" | "review";
  last_practiced_at: string | null;
  next_review_at: string | null;
};

export type SchoolVerificationStatus = "community" | "verified" | "inactive";

export type SchoolDirectoryEntry = {
  id: string;
  official_code: string | null;
  name: string;
  normalized_name: string;
  region: string;
  commune: string;
  city: string;
  school_type: "municipal" | "slep" | "subsidized" | "private" | "public" | "unknown";
  verification_status: SchoolVerificationStatus;
  source_type: "student_submitted" | "admin" | "official_import";
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StudyGoal =
  | "follow_course"
  | "reinforce"
  | "prepare_test"
  | "free_practice"
  | "paes";

export type StudentSchoolProfile = {
  user_id: string;
  school_id: string | null;
  course_id: string;
  study_goal: StudyGoal;
  school_selection_source: "student" | "guardian" | "admin";
  selected_at: string;
  updated_at: string;
};

export type StudyEventType =
  | "test"
  | "quiz"
  | "homework"
  | "guide"
  | "class_topic"
  | "other";

export type StudentStudyEvent = {
  id: string;
  user_id: string;
  school_id: string | null;
  course_id: string;
  title: string;
  event_type: StudyEventType;
  event_date: string;
  notes: string;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
};
