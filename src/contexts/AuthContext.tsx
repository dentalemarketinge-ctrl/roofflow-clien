import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, WorkspaceProfile } from '../services/api';
import { clearSession, consumeAuthRedirect, getSession, setSession } from '../services/session';

type AuthContextValue = {
  profile: WorkspaceProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useState(() => consumeAuthRedirect());
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!getSession()) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setProfile(await api.getProfile());
    } catch {
      clearSession();
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refreshProfile(); }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login({ email, password });
    setSession(result.session);
    setLoading(true);
    await refreshProfile();
  }, [refreshProfile]);

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    const result = await api.signUp({ email, password, full_name: fullName });
    if (result.session) {
      setSession(result.session);
      setLoading(true);
      await refreshProfile();
    }
    return { needsConfirmation: Boolean(result.needs_email_confirmation) };
  }, [refreshProfile]);

  const logout = useCallback(() => {
    clearSession();
    setProfile(null);
  }, []);

  const value = useMemo(() => ({ profile, loading, login, signup, refreshProfile, logout }), [
    profile, loading, login, signup, refreshProfile, logout,
  ]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
