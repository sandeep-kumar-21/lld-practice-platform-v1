import {
  Attempt,
  Problem,
  Submission,
  UserAttemptsSummary,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const errorMsg =
      data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new ApiError(res.status, typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg), data);
  }

  return data as T;
}

export const api = {
  getProblems: (filter?: { difficulty?: string; tag?: string }) => {
    const params = new URLSearchParams();
    if (filter?.difficulty) params.set('difficulty', filter.difficulty);
    if (filter?.tag) params.set('tag', filter.tag);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<Problem[]>(`/problems${query}`);
  },

  getProblemBySlug: (slug: string) => {
    return fetchJson<Problem>(`/problems/${slug}`);
  },

  startAttempt: (problemId: string, userId: string = 'learner-demo') => {
    return fetchJson<Attempt>('/attempts', {
      method: 'POST',
      body: JSON.stringify({ problemId, userId }),
    });
  },

  getAttempt: (id: string) => {
    return fetchJson<Attempt>(`/attempts/${id}`);
  },

  submitSolution: (
    attemptId: string,
    payload: {
      format: string;
      content: any;
      designRationale: string;
    },
  ) => {
    return fetchJson<{
      submissionId: string;
      status: string;
      version: number;
    }>(`/attempts/${attemptId}/submissions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getSubmission: (id: string) => {
    return fetchJson<Submission>(`/submissions/${id}`);
  },

  retryEvaluation: (id: string) => {
    return fetchJson<{ message: string; submissionId: string }>(
      `/submissions/${id}/retry-evaluation`,
      {
        method: 'POST',
      },
    );
  },

  getUserAttempts: (userId: string = 'learner-demo') => {
    return fetchJson<UserAttemptsSummary>(`/users/${userId}/attempts`);
  },

  getHealth: () => {
    return fetchJson<{
      status: string;
      timestamp: string;
      services: { mysql: string; redis: string };
    }>('/health');
  },
};

