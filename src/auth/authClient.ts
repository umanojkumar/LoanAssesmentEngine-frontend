import type { AuthSession, Credentials, RegisterData } from '../types/auth';

const SESSION_KEY = 'sme-loan-app-session';
const API_BASE_URL = '/api';

type ApiJson = Record<string, unknown>;

function getStringValue(data: ApiJson | null, keys: string[]): string | undefined {
  if (!data) {
    return undefined;
  }

  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}

async function readJson(response: Response): Promise<ApiJson | null> {
  try {
    return (await response.json()) as ApiJson;
  } catch {
    return null;
  }
}

function createSession(email: string, tokenBody?: ApiJson | null): AuthSession {
  const accessToken = getStringValue(tokenBody ?? null, [
    'accessToken',
    'access_token',
    'token',
    'jwt',
    'idToken'
  ]);
  const refreshToken = getStringValue(tokenBody ?? null, ['refreshToken', 'refresh_token']);
  const tokenType = getStringValue(tokenBody ?? null, ['tokenType', 'token_type', 'type']) ?? 'Bearer';

  return {
    user: {
      email,
      name: email.split('@')[0]
    },
    expires: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    tokens: accessToken
      ? {
          accessToken,
          refreshToken,
          tokenType
        }
      : undefined
  };
}

export async function getSession(): Promise<AuthSession | null> {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as AuthSession;
    return session;
  } catch {
    return null;
  }
}

export async function signIn({ email, password }: Credentials): Promise<AuthSession> {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const body = await readJson(response);

  if (!response.ok) {
    const message =
      getStringValue(body, ['message', 'error']) ?? 'Login failed. Please try again.';
    throw new Error(message);
  }

  if (!getStringValue(body, ['accessToken', 'access_token', 'token', 'jwt', 'idToken'])) {
    throw new Error('Login succeeded, but the API did not return a token.');
  }

  const session = createSession(email, body);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function registerUser(data: RegisterData): Promise<AuthSession> {
  if (!data.email || !data.password) {
    throw new Error('Email and password are required.');
  }

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: data.email,
      password: data.password
    })
  });

  if (!response.ok) {
    let message = 'Registration failed. Please try again.';

    try {
      const errorBody = await response.json();
      if (typeof errorBody.message === 'string') {
        message = errorBody.message;
      } else if (typeof errorBody.error === 'string') {
        message = errorBody.error;
      }
    } catch {
      // Keep the generic message when the API does not return JSON.
    }

    throw new Error(message);
  }

  const session = createSession(data.email);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function signOut(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const session = await getSession();
  const headers = new Headers(init.headers);

  if (session?.tokens?.accessToken) {
    headers.set(
      'Authorization',
      `${session.tokens.tokenType ?? 'Bearer'} ${session.tokens.accessToken}`
    );
  }

  return fetch(input, {
    ...init,
    headers
  });
}
