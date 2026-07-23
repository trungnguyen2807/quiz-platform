import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { tokenStore } from '../lib/apiClient';
import { adminLogin } from '../api/admin';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const USERNAME_KEY = 'quiz_admin_username';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [username, setUsername] = useState<string | null>(
    () => localStorage.getItem(USERNAME_KEY)
  );

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated: Boolean(token),
      username,
      login: async (user, password) => {
        const res = await adminLogin(user, password);
        tokenStore.set(res.token);
        localStorage.setItem(USERNAME_KEY, res.admin.username);
        setToken(res.token);
        setUsername(res.admin.username);
      },
      logout: () => {
        tokenStore.clear();
        localStorage.removeItem(USERNAME_KEY);
        setToken(null);
        setUsername(null);
      },
    }),
    [token, username]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
