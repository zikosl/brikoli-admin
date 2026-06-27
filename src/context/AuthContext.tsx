import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth } from '../lib/firebase';
import { getCurrentUserProfile, loginAdmin, logout as logoutService } from '../services/authService';
import type { AdminUser } from '../types/user';
import { useLanguage } from './LanguageContext';

interface AuthContextValue {
  user: FirebaseUser | null;
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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) {
        return;
      }

      setLoading(true);
      setError(null);

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const currentProfile = await getCurrentUserProfile(currentUser.uid);

        if (!currentProfile || currentProfile.role !== 'admin') {
          await logoutService();
          setUser(null);
          setProfile(null);
          setError(t('auth.accessDenied'));
          return;
        }

        setUser(currentUser);
        setProfile(currentProfile);
      } catch (authError) {
        await logoutService();
        setUser(null);
        setProfile(null);
        setError(authError instanceof Error ? authError.message : t('auth.unableVerify'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [t]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const adminProfile = await loginAdmin(email, password);
      setUser(auth.currentUser);
      setProfile(adminProfile);
    } catch (loginError) {
      setUser(null);
      setProfile(null);
      setError(loginError instanceof Error ? loginError.message : t('auth.unableSignIn'));
      throw loginError;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutService();
    setUser(null);
    setProfile(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      error,
      login,
      logout,
      clearError: () => setError(null),
    }),
    [user, profile, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
