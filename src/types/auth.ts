import type { Session } from '@auth/core/types';

export interface AuthUser {
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
}

export interface AuthSession extends Session {
  user: AuthUser;
  expires: string;
  tokens?: AuthTokens;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}
