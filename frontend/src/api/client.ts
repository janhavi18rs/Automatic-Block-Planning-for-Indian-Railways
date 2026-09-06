const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL}/api/v1`;

export interface StandardResponse<T> {
  data: T;
  meta: Record<string, any>;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<StandardResponse<T>> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage = 'API Request Failed';
    try {
      const errJson = await response.json();
      errMessage = errJson.detail || errJson.message || response.statusText;
    } catch (e) {}
    throw new Error(errMessage);
  }

  return response.json();
}
