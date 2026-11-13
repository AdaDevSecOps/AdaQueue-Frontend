const BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/+$/, '');

export function apiPath(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return BASE ? `${BASE}${p}` : p;
}

export const API_CONFIG = Object.freeze({ BASE });

let authToken: string | null = null;
export const setApiToken = (value: string | null) => { authToken = value; };
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = new URL(input, window.location.href);
  const api = new URL(apiPath('/api/'), window.location.href);
  if (url.origin !== api.origin || !url.pathname.startsWith(api.pathname)) throw new Error('Unexpected API destination');
  const headers = new Headers(init?.headers);
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  const response = await fetch(input, { ...init, headers, redirect: 'error' });
  if (response.status === 401) window.dispatchEvent(new Event('adaqueue:unauthorized'));
  return response;
}
