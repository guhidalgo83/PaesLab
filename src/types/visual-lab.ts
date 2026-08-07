export type VisualLabProgressRow = {
  lab_slug: string;
  attempts: number;
  last_score: number;
  best_score: number;
  completed: boolean;
  last_completed_at: string | null;
  updated_at: string;
};

export type VisualLabSaveResult = {
  lab_slug: string;
  attempts: number;
  last_score: number;
  best_score: number;
  completed: boolean;
};
