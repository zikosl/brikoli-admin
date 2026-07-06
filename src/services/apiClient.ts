const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1').replace(/\/$/, '');

const accessTokenKey = 'brikoli-admin-access-token';
const refreshTokenKey = 'brikoli-admin-refresh-token';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

export function getAccessToken() {
  return window.localStorage.getItem(accessTokenKey);
}

export function getRefreshToken() {
  return window.localStorage.getItem(refreshTokenKey);
}

export function setAuthSession(session: AuthSession) {
  window.localStorage.setItem(accessTokenKey, session.accessToken);
  window.localStorage.setItem(refreshTokenKey, session.refreshToken);
}

export function clearAuthSession() {
  window.localStorage.removeItem(accessTokenKey);
  window.localStorage.removeItem(refreshTokenKey);
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearAuthSession();
    return null;
  }

  const session = (await response.json()) as AuthSession;
  setAuthSession(session);
  return session.accessToken;
}

type ApiOptions = RequestInit & {
  auth?: boolean;
  retry?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, retry = true, headers, ...init } = options;
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 401 && auth && retry) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      return apiFetch<T>(path, { ...options, retry: false });
    }
  }

  if (!response.ok) {
    const message = await response
      .json()
      .then((body: { message?: string | string[] }) => body.message)
      .catch(() => null);
    throw new Error(Array.isArray(message) ? message.join(', ') : message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
