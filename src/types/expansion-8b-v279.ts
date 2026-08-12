export type V279Topic = {
  topic_id: string;
  practice: number;
  diagnostic: number;
  review: number;
  metadata: number;
  q4: number;
  auto_gate: boolean;
  human_certified: boolean;
  release_candidate: boolean;
  blockers: string[];
  priority: string;
};

export type V279Overview = {
  course_id: string;
  curriculum_snapshot: {
    snapshot_date: string;
    update_process_status: string;
    requires_revalidation_before_release: boolean;
  } | null;
  official_oas: number;
  deep_topics: number;
  curriculum_nodes: number;
  micro_lessons: number;
  worked_examples: number;
  guided_practice: number;
  practice: number;
  diagnostic: number;
  review: number;
  review_sets: number;
  adaptive_metadata: number;
  heuristic_metadata: number;
  calibrated_metadata: number;
  diagnostic_blueprints: number;
  route_contracts: number;
  auto_gate_topics: number;
  human_certified_topics: number;
  release_candidates: number;
  published_deep_topics: number;
  published_assessment_items: number;
  live_student_delivery: boolean;
  topics: V279Topic[];
};
