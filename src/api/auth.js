/**
 * Authentication API calls
 */

import { clearAuthSession } from '../lib/authSession';

// API interceptor - adjust based on your actual implementation
const apiInterceptor = async (config) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://highway-hustle-backend.onrender.com/api';
  const url = `${baseURL}${config.url}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...config.headers,
  };

  try {
    const response = await fetch(url, {
      method: config.method || 'GET',
      headers,
      body: config.data ? JSON.stringify(config.data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData = await response.json();
    return { data: jsonData };
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Login with wallet, email, or OAuth
 * Sends user data to backend for authentication
 */
export const login = async (payload = {}) => {
  console.log('[api/login] Sending /user/login request', payload);

  if (!payload?.walletAddress && !payload?.jwt) {
    console.warn('[api/login] No walletAddress or jwt provided');
    return undefined;
  }

  // Check for existing token
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    console.log('[api/login] Existing JWT found, skipping login');
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

      console.log('[api/login] Login succeeded; token and username stored', {
        hasToken: !!newToken,
        username: userName,
      });
    }

    return response.data;
  } catch (error) {
    console.error('[api/login] Login failed', error);
    return {
      success: false,
      message: 'Login failed',
      data: { token: '' },
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
 * Get stored username
 */
export const getUsername = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('username');
};
