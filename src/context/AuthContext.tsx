import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAccessToken } from '../services/apiClient';
import { getCurrentUserProfile, loginAdmin, logout as logoutService } from '../services/authService';
import type { AdminUser } from '../types/user';
import { useLanguage } from './LanguageContext';

interface AuthContextValue {
  user: AdminUser | null;
  profile: AdminUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }

      try {
        const currentProfile = await getCurrentUserProfile();

        if (!active) {
          return;
        }

        if (!currentProfile || currentProfile.role !== 'admin') {
          await logoutService();
          setProfile(null);
          setError(t('auth.accessDenied'));
          return;
        }

        setProfile(currentProfile);
      } catch (authError) {
        if (!active) {
          return;
        }
        await logoutService();
        setProfile(null);
        setError(authError instanceof Error ? authError.message : t('auth.unableVerify'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [t]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const adminProfile = await loginAdmin(email, password);
      setProfile(adminProfile);
    } catch (loginError) {
      setProfile(null);
      setError(loginError instanceof Error ? loginError.message : t('auth.unableSignIn'));
      throw loginError;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutService();
    setProfile(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: profile,
      profile,
      loading,
      error,
      login,
      logout,
      clearError: () => setError(null),
    }),
    [profile, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <LoadingSpinner fullScreen label={t('auth.checkingAccess')} />;
  }

  return children;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
