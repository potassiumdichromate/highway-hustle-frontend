const AUTH_SESSION_KEY = 'privySession';
const AUTH_USER_KEY = 'privyUser';

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
  if (session) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  }
  if (user !== undefined) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new CustomEvent('auth:session-change', { detail: session || null }));
  return session || null;
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new CustomEvent('auth:session-change', { detail: null }));
};

export const isSessionActive = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    localStorage.getItem('token') ||
      localStorage.getItem(AUTH_SESSION_KEY) ||
      localStorage.getItem(AUTH_USER_KEY)
  );
};
