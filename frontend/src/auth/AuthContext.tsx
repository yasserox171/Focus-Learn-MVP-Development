import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';

import api, { clearTokens, getAccessToken, setTokens } from '../api/client';
import type { User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  setUiLanguage: (lang: 'ar' | 'fr') => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!getAccessToken());
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!getAccessToken()) return;
    api
      .get<User>('/me/')
      .then((r) => setUser(r.data))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('fl-logout', onLogout);
    return () => window.removeEventListener('fl-logout', onLogout);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const { data } = await api.post('/auth/login/', { username, password });
      setTokens(data.access, data.refresh);
      setUser(data.user);
      // Follow the account's saved UI language preference on login
      if (data.user.preferred_ui_language) {
        i18n.changeLanguage(data.user.preferred_ui_language);
      }
      return data.user as User;
    },
    [i18n],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const setUiLanguage = useCallback(
    async (lang: 'ar' | 'fr') => {
      i18n.changeLanguage(lang);
      if (getAccessToken()) {
        try {
          const { data } = await api.patch<User>('/me/', {
            preferred_ui_language: lang,
          });
          setUser(data);
        } catch {
          // Keep the local switch even if persisting fails
        }
      }
    },
    [i18n],
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUiLanguage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
