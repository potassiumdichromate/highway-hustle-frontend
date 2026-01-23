import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PrivyProvider } from '@privy-io/react-auth';
import { WalletProvider } from './context/WalletContext';
import Login from './pages/Login';
import DriverLicense from './pages/DriverLicense';
import Game from './pages/Game';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const zeroGChain = {
  id: 16661,
  name: '0G Mainnet',
  network: '0g-mainnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Explorer', url: 'https://chainscan.0g.ai' },
  },
};

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
  const privyConfig = {
    wallets: {
      injected: {
        enabled: true,
      },
    },
    supportedChains: [zeroGChain],
    defaultChain: zeroGChain,
    embeddedWallets: {
      ethereum: {
        createOnLogin: 'users-without-wallets',
      },
    },
  };
  console.log('[App] Privy config snapshot', privyConfig);
  
  return (
    <PrivyProvider 
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={privyConfig}
    >
      <AppContent />
    </PrivyProvider>
  );
}

export default App;
