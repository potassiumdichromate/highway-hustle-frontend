/**
 * Authentication API calls
 */

import { clearAuthSession } from '../lib/authSession';
import { debugError, debugLog, debugWarn } from '../lib/debug';

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
    const json = atob(padded);
    return JSON.parse(json);
  } catch (_err) {
    return null;
  }
};

const isTokenExpiredResponse = (status, payload) => {
  if (status !== 401) return false;
  const errorText =
    payload?.error ||
    payload?.message ||
    payload?.code ||
    '';
  return /token|expired|unauthorized|unauthorised|jwt/i.test(String(errorText));
};

const forceLogoutForExpiredToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('sessionWallet');
  localStorage.removeItem('walletAddress');
  clearAuthSession();
  window.dispatchEvent(new CustomEvent('presence:token-change', { detail: null }));
  // Route to login without hard reload so debug logs remain visible.
  if (window.location.pathname !== '/') {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

// API interceptor - adjust based on your actual implementation
export const apiInterceptor = async (config) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
    || 'https://highway-hustle-backend.onrender.com/api';
  const url = `${baseURL}${config.url}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const tokenPayload = decodeJwtPayload(token);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expSeconds = Number(tokenPayload?.exp || 0);

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...config.headers,
  };

  try {
    debugLog('[api] Request start', {
      method: (config.method || 'GET').toUpperCase(),
      url,
      hasToken: Boolean(token),
      hasAuthorizationHeader: Boolean(headers.Authorization),
      tokenExpISO: expSeconds ? new Date(expSeconds * 1000).toISOString() : null,
      tokenExpiredAtClient: expSeconds ? expSeconds <= nowSeconds : null,
    });

    const response = await fetch(url, {
      method: config.method || 'GET',
      headers,
      body: config.data ? JSON.stringify(config.data) : undefined,
    });

    if (!response.ok) {
      let errorPayload = null;
      const responseText = await response.text();
      if (responseText) {
        try {
          errorPayload = JSON.parse(responseText);
        } catch (_parseErr) {
          errorPayload = { message: responseText };
        }
      }

      debugWarn('[api] Request failed', {
        method: (config.method || 'GET').toUpperCase(),
        url,
        status: response.status,
        hasToken: Boolean(token),
        tokenExpISO: expSeconds ? new Date(expSeconds * 1000).toISOString() : null,
        tokenExpiredAtClient: expSeconds ? expSeconds <= nowSeconds : null,
        responsePayload: errorPayload,
      });

      if (isTokenExpiredResponse(response.status, errorPayload)) {
        debugWarn('[api] Triggering forced logout due to 401 token/auth response', {
          method: (config.method || 'GET').toUpperCase(),
          url,
          status: response.status,
          reason: errorPayload?.error || errorPayload?.message || errorPayload?.code || 'unknown',
        });
        forceLogoutForExpiredToken();
      }

      const enrichedError = new Error(
        errorPayload?.error ||
          errorPayload?.message ||
          `HTTP error! status: ${response.status}`
      );
      enrichedError.status = response.status;
      enrichedError.payload = errorPayload;
      throw enrichedError;
    }

    const jsonData = await response.json();
    debugLog('[api] Request success', {
      method: (config.method || 'GET').toUpperCase(),
      url,
      status: response.status,
    });
    return { data: jsonData };
  } catch (error) {
    debugError('API request failed:', error);
    throw error;
  }
};

/**
 * Login with wallet, email, or OAuth
 * Sends user data to backend for authentication
 */
export const login = async (payload = {}) => {
  debugLog('[api/login] Sending /user/login request');

  if (!payload?.walletAddress && !payload?.jwt) {
    debugWarn('[api/login] No walletAddress or jwt provided');
    return undefined;
  }

  // Check for existing token
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    debugLog('[api/login] Existing JWT found, skipping login');
    return undefined;
  }

  try {
    const response = await apiInterceptor({
      method: 'post',
      url: '/player/login',
      data: {
        walletAddress: payload.walletAddress,
        email: payload.privyMetaData?.email || payload.email,
        privyUserId: payload.privyMetaData?.privyUserId || payload.privyUserId,
        privyMetaData: payload.privyMetaData || {
          address: payload.walletAddress,
          discord: payload.privyMetaData?.discord || '',
          email: payload.privyMetaData?.email || payload.email || '',
          type: payload.privyMetaData?.type || 'unknown',
          privyUserId: payload.privyMetaData?.privyUserId || payload.privyUserId || '',
        },
      },
    });

    const responsePayload = response.data?.data || response.data;
    const newToken = responsePayload?.token;

    if (newToken && typeof window !== 'undefined') {
      localStorage.setItem('token', newToken);
      const userName = responsePayload?.username || responsePayload?.name || '';
      if (userName) {
        localStorage.setItem('username', userName);
      }

      // Dispatch custom event for token changes
      window.dispatchEvent(
        new CustomEvent('presence:token-change', { detail: newToken })
      );

      debugLog('[api/login] Login succeeded; token and username stored', {
        hasToken: !!newToken,
        username: userName,
      });
    }

    return response.data;
  } catch (error) {
    debugError('[api/login] Login failed', error);
    return {
      success: false,
      message: 'Login failed',
      data: { token: '' },
      error: error.message,
    };
  }
};

/**
 * Auto-login using a browser JWT token.
 * Called when the app is loaded with ?token=...&source=browser in the URL.
 * Reference: guesstheai loginV2({ jwt, source: "browser" })
 */
export const autoLogin = async ({ jwt, source = 'browser' }) => {
  debugLog('[api/autoLogin] Sending /player/login/auto request');

  if (!jwt) {
    debugWarn('[api/autoLogin] No jwt provided');
    return undefined;
  }

  try {
    const response = await apiInterceptor({
      method: 'post',
      url: '/player/login/auto',
      data: { jwt, source },
    });

    const responsePayload = response.data?.data || response.data;

    if (responsePayload && typeof window !== 'undefined') {
      // Extract wallet address from the player data returned by the backend
      const walletAddress =
        responsePayload.privyData?.walletAddress ||
        responsePayload.walletAddress ||
        '';

      if (walletAddress) {
        localStorage.setItem('walletAddress', walletAddress);
      }

      debugLog('[api/autoLogin] Auto-login succeeded', {
        success: response.data?.success,
        walletAddress: walletAddress ? `${walletAddress.slice(0, 6)}...` : 'none',
      });
    }

    return response.data;
  } catch (error) {
    debugError('[api/autoLogin] Auto-login failed', error);
    return {
      success: false,
      message: 'Auto-login failed',
      error: error.message,
    };
  }
};

/**
 * Logout - clears stored credentials
 */
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('sessionWallet');
    localStorage.removeItem('walletAddress');
    clearAuthSession();
    window.dispatchEvent(new CustomEvent('presence:token-change', { detail: null }));
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

/**
 * Get stored authentication token
 */
export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

/**
 * Get the wallet address encoded in the current JWT.
 * This is the authoritative identity the backend enforces on all requests.
 * Use this for ?user= params instead of localStorage.walletAddress or WalletContext.account.
 */
export const getJwtWalletAddress = () => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  const payload = decodeJwtPayload(token);
  return payload?.walletAddress || payload?.identifier || null;
};

/**
 * Get stored username
 */
export const getUsername = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('username');
};

// ── SIWE helpers ──────────────────────────────────────────────────────────────

const getApiBase = () =>
  (import.meta.env.VITE_API_BASE_URL || 'https://highway-hustle-backend.onrender.com/api');

export const getSiweNonce = async (address) => {
  const res = await fetch(
    `${getApiBase()}/player/auth/siwe-nonce?address=${encodeURIComponent(address)}`,
  );
  if (!res.ok) throw new Error(`nonce request failed: ${res.status}`);
  const data = await res.json();
  if (!data?.nonce) throw new Error('server returned no nonce');
  return data.nonce;
};

export const loginWithSiwe = async (message, signature) => {
  const res = await fetch(`${getApiBase()}/player/auth/siwe-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `SIWE login failed: ${res.status}`);
  }
  const data = await res.json();
  const token = data?.data?.token;
  if (token && typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    window.dispatchEvent(new CustomEvent('presence:token-change', { detail: token }));
  }
  return data;
};
