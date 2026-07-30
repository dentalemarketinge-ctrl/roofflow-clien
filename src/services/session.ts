export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
}

const SESSION_KEY = 'roofflow.auth.session';
const AUTH_REDIRECT_KEY = 'roofflow.auth.redirect-type';

export const getSession = (): AuthSession | null => {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) as AuthSession : null;
  } catch {
    return null;
  }
};

export const setSession = (session: AuthSession) => {
  const expiresAt = session.expires_at || Math.floor(Date.now() / 1000) + (session.expires_in || 3600);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, expires_at: expiresAt }));
};

export const clearSession = () => localStorage.removeItem(SESSION_KEY);

export const consumeAuthRedirect = (): string | null => {
  const hash = window.location.hash.replace(/^#/, '');
  const candidate = hash.startsWith('/')
    ? (hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '')
    : hash;
  const params = new URLSearchParams(candidate);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return localStorage.getItem(AUTH_REDIRECT_KEY);

  setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: Number(params.get('expires_in') || 3600),
  });
  const type = params.get('type') || 'invite';
  localStorage.setItem(AUTH_REDIRECT_KEY, type);
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}#/set-password`);
  return type;
};

export const clearAuthRedirect = () => localStorage.removeItem(AUTH_REDIRECT_KEY);

export const getValidAccessToken = async (): Promise<string | null> => {
  const session = getSession();
  if (!session) return null;
  const expiresAt = session.expires_at || 0;
  if (expiresAt > Math.floor(Date.now() / 1000) + 60) return session.access_token;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!response.ok) throw new Error('Session refresh failed');
    const data = await response.json();
    setSession(data.session);
    return data.session.access_token;
  } catch {
    clearSession();
    return null;
  }
};
