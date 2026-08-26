import { BriefAnswers } from './brief';

export interface AdminUser {
  id: number;
  username: string;
  role: string;
}

export type SubmissionStatus = 'new' | 'in_review' | 'approved' | 'rejected' | 'completed';

export interface SubmissionItem {
  id: number;
  reference_code: string;
  client_name: string;
  phone: string;
  contact_method?: string;
  preferred_time?: string;
  store_name?: string;
  budget?: string;
  timeline?: string;
  status: SubmissionStatus;
  notes?: string;
  answers_json?: string;
  answers?: BriefAnswers;
  created_at: string;
  updated_at?: string;
}

export interface AdminStats {
  total: number;
  by_status: {
    new: number;
    in_review: number;
    approved: number;
    rejected: number;
    completed: number;
  };
  by_budget: Array<{ budget: string; cnt: number }>;
  latest_submission: string | null;
}

export interface SubmissionsPagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}
