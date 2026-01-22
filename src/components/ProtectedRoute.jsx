import React from 'react';
import { Navigate } from 'react-router-dom';
import { isSessionActive } from '../lib/authSession';

export default function ProtectedRoute({ children }) {
  const hasSession = isSessionActive();
  console.log('[ProtectedRoute] Checking authentication:', { hasSession });

  if (!hasSession) {
    console.log('[ProtectedRoute] No session found, redirecting to login');
    return <Navigate to="/" replace />;
  }

  console.log('[ProtectedRoute] User authenticated, allowing access');
  return children;
}
