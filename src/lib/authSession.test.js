import { beforeEach, describe, expect, it } from 'vitest';
import { clearAuthSession, isSessionActive, setAuthSession } from './authSession';

const buildJwt = (expSeconds) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: expSeconds }));
  return `${header}.${payload}.sig`;
};

describe('authSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false when token is missing', () => {
    setAuthSession({ session: { x: 1 }, user: { id: 'u' } });
    expect(isSessionActive()).toBe(false);
  });

  it('returns true when token is valid and session exists', () => {
    localStorage.setItem('token', buildJwt(Math.floor(Date.now() / 1000) + 300));
    setAuthSession({ session: { x: 1 }, user: { id: 'u' } });
    expect(isSessionActive()).toBe(true);
  });

  it('returns false when token is expired', () => {
    localStorage.setItem('token', buildJwt(Math.floor(Date.now() / 1000) - 60));
    setAuthSession({ session: { x: 1 }, user: { id: 'u' } });
    expect(isSessionActive()).toBe(false);
  });

  it('clears session keys', () => {
    localStorage.setItem('token', buildJwt(Math.floor(Date.now() / 1000) + 300));
    setAuthSession({ session: { x: 1 }, user: { id: 'u' } });
    clearAuthSession();
    expect(localStorage.getItem('privySession')).toBeNull();
    expect(localStorage.getItem('privyUser')).toBeNull();
  });
});
