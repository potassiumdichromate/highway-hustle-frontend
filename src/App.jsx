import React, { useEffect } from 'react';
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
  useEffect(() => {
    // Mobile viewport height fix for iOS
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial viewport height
    setViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    // Prevent zoom on double tap for iOS
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

    // Prevent pinch zoom
    const preventPinchZoom = (event) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventPinchZoom, { passive: false });

    // Cleanup
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      document.removeEventListener('touchend', preventDoubleTapZoom);
      document.removeEventListener('touchmove', preventPinchZoom);
    };
  }, []);

  useEffect(() => {
    // Disable pull-to-refresh on mobile
    document.body.style.overscrollBehavior = 'none';
    
    // Add touch-action to prevent default touch behaviors
    document.body.style.touchAction = 'pan-x pan-y';

    // Prevent iOS Safari bounce effect
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overscrollBehavior = '';
      document.body.style.touchAction = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, []);

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
    appearance: {
      theme: 'dark',
      accentColor: '#00d4ff',
      logo: undefined, // Add your logo URL here if you have one
      showWalletLoginFirst: true,
    },
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
    // Mobile optimizations
    loginMethods: ['wallet', 'email', 'sms'],
    // Add mobile-friendly settings
    mobileConfig: {
      // Optimize for mobile wallet connections
      preferredWalletConnectVersion: 2,
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