const AUTH_SESSION_KEY = 'privySession';
const AUTH_USER_KEY = 'privyUser';
const TOKEN_KEY = 'token';

const getTokenPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.error('[authSession] Failed to write localStorage', {
      key,
      error: err?.message || err,
    });
    return false;
  }
};

export const getAuthSession = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
};

export const getAuthUser = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
};

export const setAuthSession = ({ session, user }) => {
  if (typeof window === 'undefined') return null;
  const sessionRaw = session ? JSON.stringify(session) : null;
  const userRaw = user !== undefined ? JSON.stringify(user) : null;
  console.log('[authSession] Persisting session', {
    hasSession: !!session,
    hasUser: user !== undefined,
    sessionKeys: session && typeof session === 'object' ? Object.keys(session) : [],
    userKeys: user && typeof user === 'object' ? Object.keys(user) : [],
  });
  if (session) {
    safeSetItem(AUTH_SESSION_KEY, sessionRaw);
  }
  if (user !== undefined) {
    safeSetItem(AUTH_USER_KEY, userRaw);
  }
  window.dispatchEvent(new CustomEvent('auth:session-change', { detail: session || null }));
  return session || null;
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  console.log('[authSession] Clearing session keys', {
    hasSession: !!localStorage.getItem(AUTH_SESSION_KEY),
    hasUser: !!localStorage.getItem(AUTH_USER_KEY),
  });
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem('walletAddress');
  window.dispatchEvent(new CustomEvent('auth:session-change', { detail: null }));
};

export const isSessionActive = () => {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem(TOKEN_KEY);
  const tokenPayload = getTokenPayload(token);
  const exp = Number(tokenPayload?.exp || 0);
  const hasValidToken = Boolean(token && (!exp || exp > Math.floor(Date.now() / 1000)));
  const hasSession = !!localStorage.getItem(AUTH_SESSION_KEY);
  const hasUser = !!localStorage.getItem(AUTH_USER_KEY);
  return Boolean(hasValidToken && (hasSession || hasUser));
};
