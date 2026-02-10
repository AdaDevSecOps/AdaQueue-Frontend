const BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/+$/, '');

export function apiPath(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return BASE ? `${BASE}${p}` : p;
}

export const API_CONFIG = Object.freeze({ BASE });
