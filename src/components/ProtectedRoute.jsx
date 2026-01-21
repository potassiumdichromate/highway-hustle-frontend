import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

export default function ProtectedRoute({ children }) {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  return children;
}
