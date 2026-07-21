/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('erp_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('erp_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('erp_token');
  localStorage.removeItem('erp_user');
}

export function getStoredUser() {
  const u = localStorage.getItem('erp_user');
  if (!u) return null;
  try {
    return JSON.parse(u);
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user: any) {
  localStorage.setItem('erp_user', JSON.stringify(user));
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T = any>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, body?: any) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T = any>(url: string, body?: any) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = any>(url: string) => request<T>(url, { method: 'DELETE' })
};
