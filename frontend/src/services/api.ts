import { SubmissionPayload, SubmissionResult } from '../types/brief';
import { AdminStats, SubmissionItem, SubmissionsPagination, SubmissionStatus } from '../types/admin';

// Base API URL configuration
const getApiBase = (): string => {
  // In Vite dev mode, use '/api' (which is proxied to backend)
  // In production (view folder served by PHP), detect relative path
  return './api';
};

class ApiService {
  private tokenKey = 'brief_admin_token';

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  public removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  public hasToken(): boolean {
    return !!this.getToken();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${getApiBase()}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({
      status: 'error',
      message: 'Некоректна відповідь сервера.'
    }));

    if (!response.ok || data.status === 'error') {
      if (response.status === 401) {
        this.removeToken();
      }
      throw new Error(data.message || `Помилка сервера HTTP ${response.status}`);
    }

    return data;
  }

  // --- Public Endpoints ---

  public async submitBrief(payload: SubmissionPayload): Promise<{ status: string; message: string; data: SubmissionResult }> {
    return this.request('/brief', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async checkBriefStatus(ref: string): Promise<{ status: string; data: Partial<SubmissionResult> }> {
    return this.request(`/brief/status/${encodeURIComponent(ref)}`);
  }

  // --- Admin Endpoints ---

  public async adminLogin(username: string, password: string): Promise<{ data: { user: { id: number; username: string; role: string }; token: string } }> {
    const res = await this.request<{ data: { user: { id: number; username: string; role: string }; token: string } }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  public async adminMe(): Promise<{ data: { user: { id: number; username: string; role: string } } }> {
    return this.request('/admin/me');
  }

  public async adminLogout(): Promise<void> {
    try {
      await this.request('/admin/logout', { method: 'POST' });
    } finally {
      this.removeToken();
    }
  }

  public async adminGetSubmissions(params: {
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<{
    data: {
      submissions: SubmissionItem[];
      pagination: SubmissionsPagination;
      stats: AdminStats;
    };
  }> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);
    if (params.page) query.set('page', params.page.toString());
    if (params.per_page) query.set('per_page', params.per_page.toString());

    return this.request(`/admin/submissions?${query.toString()}`);
  }

  public async adminGetSubmission(id: number): Promise<{ data: SubmissionItem }> {
    return this.request(`/admin/submissions/${id}`);
  }

  public async adminUpdateSubmission(id: number, data: Partial<SubmissionItem>): Promise<{ data: SubmissionItem; message: string }> {
    return this.request(`/admin/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  public async adminUpdateStatus(id: number, status: SubmissionStatus): Promise<{ message: string }> {
    return this.request(`/admin/submissions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  public async adminDeleteSubmission(id: number): Promise<{ message: string }> {
    return this.request(`/admin/submissions/${id}`, {
      method: 'DELETE'
    });
  }

  public getExportUrl(format: 'csv' | 'json'): string {
    const token = this.getToken();
    return `${getApiBase()}/admin/export?format=${format}${token ? '&token=' + encodeURIComponent(token) : ''}`;
  }
}

export const api = new ApiService();
