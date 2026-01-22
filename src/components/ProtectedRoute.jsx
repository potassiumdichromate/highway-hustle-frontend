import React from 'react';
import { Navigate } from 'react-router-dom';
import { isSessionActive } from '../lib/authSession';

export default function ProtectedRoute({ children }) {
  const hasSession = isSessionActive();
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('token') : false;
  const hasPrivySession =
    typeof window !== 'undefined' ? !!localStorage.getItem('privySession') : false;
  const hasPrivyUser =
    typeof window !== 'undefined' ? !!localStorage.getItem('privyUser') : false;
  console.log('[ProtectedRoute] Checking authentication:', {
    hasSession,
    hasToken,
    hasPrivySession,
    hasPrivyUser,
  });

  if (!hasSession) {
    console.log('[ProtectedRoute] No session found, redirecting to login');
    return <Navigate to="/" replace />;
  }

  console.log('[ProtectedRoute] User authenticated, allowing access');
  return children;
}
