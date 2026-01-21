import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import Login from './pages/Login';
import DriverLicense from './pages/DriverLicense';
import Game from './pages/Game';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
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

export default App;