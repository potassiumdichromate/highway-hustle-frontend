import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PrivyProvider } from '@privy-io/react-auth';
import { WalletProvider } from './context/WalletContext';
import Login from './pages/Login';
import DriverLicense from './pages/DriverLicense';
import Game from './pages/Game';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function AppContent() {
  return (
    <WalletProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/license"
            element={
              <ProtectedRoute>
                <DriverLicense />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/:gameMode"
            element={
              <ProtectedRoute>
                <Game />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </WalletProvider>
  );
}

function App() {
  console.log('[App] Initializing with Privy App ID:', import.meta.env.VITE_PRIVY_APP_ID);
  
  return (
    <PrivyProvider 
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        wallets: {
          injected: {
            enabled: true,
          },
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <AppContent />
    </PrivyProvider>
  );
}

export default App;