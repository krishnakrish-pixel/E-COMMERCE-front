// Small fetch wrapper used by all contexts to talk to the Spring Boot backend.

const API_URL: string =
  (import.meta as any).env?.VITE_API_URL || '/api';

const TOKEN_KEY = 'shophub_token';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Set to false for login / register / public calls so a 401 is not treated as "session expired". */
  auth?: boolean;
}

/** Fired when the backend says our token is no longer valid, AuthContext listens and logs out. */
export const UNAUTHORIZED_EVENT = 'shophub:unauthorized';

export async function api<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      'Cannot reach the server. Please make sure the backend is running on ' + API_URL.replace(/\/api$/, ''),
      0
    );
  }

  if (response.status === 204) return undefined as T;

  let data: any = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && auth && token) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(
      (data && data.message) || `Request failed (${response.status})`,
      response.status
    );
  }

  return data as T;
}
