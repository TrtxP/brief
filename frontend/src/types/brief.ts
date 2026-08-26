export type QuestionType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'section';

export interface Question {
  id: string;
  index: number;
  title: string;
  description?: string | null;
  type: QuestionType;
  options?: string[];
  hasOther?: boolean;
  required?: boolean;
  placeholder?: string;
  sectionId: string;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  iconName: string;
  questionIds: string[];
}

export type BriefAnswers = Record<string, string | string[]>;

export interface SubmissionPayload {
  client_name: string;
  phone: string;
  contact_method?: string;
  preferred_time?: string;
  store_name?: string;
  budget?: string;
  timeline?: string;
  answers: BriefAnswers;
}

export interface SubmissionResult {
  id: number;
  reference_code: string;
  client_name: string;
  phone: string;
  status: 'new' | 'in_review' | 'approved' | 'rejected' | 'completed';
  created_at: string;
}
