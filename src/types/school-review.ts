export type SchoolReviewSet = {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  is_published: boolean;
};

export type SchoolReviewOption = {
  id: string;
  text: string;
};

export type SchoolReviewStart = {
  session_id: string;
  review_set_id: string;
  review_title: string;
  total_questions: number;
};

export type SchoolReviewQuestion = {
  complete: boolean;
  item_id?: string;
  position: number;
  total_questions: number;
  answered_questions: number;
  prompt: string;
  options: SchoolReviewOption[];
  difficulty: string;
  skill: string;
};

export type SchoolReviewAnswer = {
  is_correct: boolean;
  correct_option: string;
  feedback: string;
  explanation: string;
};

export type SchoolReviewCompletion = {
  session_id: string;
  review_set_id: string;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  score_percent: number;
};
