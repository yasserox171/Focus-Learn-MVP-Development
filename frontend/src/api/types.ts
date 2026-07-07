export type Role = 'admin' | 'teacher' | 'student' | 'parent';
export type ContentLanguage = 'ar' | 'fr';
export type LessonStatus = 'draft' | 'published';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  phone: string | null;
  avatar_url: string | null;
  preferred_ui_language: ContentLanguage;
  created_at: string;
}

export interface Subject {
  id: number;
  name_ar: string;
  name_fr: string;
  slug: string;
}

export interface Level {
  id: number;
  name_ar: string;
  name_fr: string;
  slug: string;
  order: number;
}

export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'latex'; text: string }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'video'; url: string };

export interface LessonListItem {
  id: number;
  slug: string;
  title: string;
  language: ContentLanguage;
  subject: Subject;
  level: Level;
  author_username: string;
  video_url: string | null;
  translation_group: string | null;
  tags: string[];
  status: LessonStatus;
  created_at: string;
  updated_at: string;
}

export interface Lesson extends LessonListItem {
  content: { blocks: ContentBlock[] };
}

export interface Choice {
  id: number;
  text: string;
  is_correct?: boolean;
}

export interface Question {
  id: number;
  text: string;
  order: number;
  choices: Choice[];
}

export interface QuizListItem {
  id: number;
  slug: string;
  title: string;
  language: ContentLanguage;
  lesson: number | null;
  lesson_title: string | null;
  level: Level;
  quiz_type: 'lesson' | 'entrance_exam';
  status: LessonStatus;
  questions_count: number;
  created_at: string;
}

export interface Quiz extends QuizListItem {
  questions: Question[];
}

export interface CorrectionEntry {
  question_id: number;
  chosen_choice_id: number | null;
  correct_choice_id: number | null;
  is_correct: boolean;
}

export interface SubmitResult {
  attempt_id: number;
  score: number;
  total_questions: number;
  correction: CorrectionEntry[];
}

export interface Attempt {
  id: number;
  quiz: number;
  quiz_title: string;
  score: number;
  total_questions: number;
  answers: Record<string, number>;
  completed_at: string;
}

export interface Progress {
  completed_lessons: number;
  viewed_lessons: number;
  attempts_count: number;
  average_score_pct: number | null;
  last_activity: string | null;
}

export interface DashboardStats {
  students_count: number;
  lessons_count: number;
  published_lessons_count: number;
  quizzes_count: number;
  attempts_count: number;
  recent_attempts: {
    student: string;
    quiz: string;
    score: number;
    total_questions: number;
    completed_at: string;
  }[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ImportResult {
  created: { id: number; title: string }[];
  errors: { index: number; title: string; error: string }[];
}
