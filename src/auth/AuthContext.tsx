import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode
} from 'react';
import {
  getSession,
  registerUser,
  signIn as authSignIn,
  signOut as authSignOut
} from './authClient';
import type { AuthSession, Credentials, RegisterData } from '../types/auth';

interface AuthContextValue {
  user: AuthSession | null;
  loading: boolean;
  signIn: (credentials: Credentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      setUser(session);
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn: async (credentials: Credentials) => {
        const session = await authSignIn(credentials);
        setUser(session);
      },
      register: async (data: RegisterData) => {
        const session = await registerUser(data);
        setUser(session);
      },
      signOut: async () => {
        await authSignOut();
        setUser(null);
      }
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
