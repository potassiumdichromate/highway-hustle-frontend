const AUTH_SESSION_KEY = 'privySession';
const AUTH_USER_KEY = 'privyUser';

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
  window.dispatchEvent(new CustomEvent('auth:session-change', { detail: null }));
};

export const isSessionActive = () => {
  if (typeof window === 'undefined') return false;
  const hasToken = !!localStorage.getItem('token');
  const hasSession = !!localStorage.getItem(AUTH_SESSION_KEY);
  const hasUser = !!localStorage.getItem(AUTH_USER_KEY);
  return Boolean(hasToken || hasSession || hasUser);
};
