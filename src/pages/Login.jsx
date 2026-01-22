import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import SynthwaveBackground from '../components/SynthwaveBackground';
import LoginModal from '../components/LoginModal';
import { isSessionActive } from '../lib/authSession';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const maybeRedirect = () => {
      if (isSessionActive()) {
        console.log('[Login] Session detected, redirecting to /license');
        navigate('/license');
      }
    };

    if (typeof window !== 'undefined') {
      maybeRedirect();
      const handleAuthChange = () => {
        maybeRedirect();
      };
      window.addEventListener('auth:session-change', handleAuthChange);
      window.addEventListener('presence:token-change', handleAuthChange);
      return () => {
        window.removeEventListener('auth:session-change', handleAuthChange);
        window.removeEventListener('presence:token-change', handleAuthChange);
      };
    }

    return undefined;
  }, [navigate]);

  const handleOpenLoginModal = () => {
    console.log('[Login] Opening login modal');
    setShowLoginModal(true);
  };

  return (
    <div className="login-page">
      <SynthwaveBackground />
      <div className="scan-line" />
      <div className="grain-overlay" />
      
      <div className="login-container">
        <motion.div
          className="login-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Logo and Title */}
          <motion.div
            className="login-header"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="logo-container">
              <Zap className="logo-icon" size={64} />
            </div>
            <h1 className="game-title neon-text">HIGHWAY HUSTLE</h1>
            <p className="game-subtitle">Kult Games</p>
          </motion.div>

          {/* Login Button */}
          <motion.div
            className="connect-card glass-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <motion.button
              className="connect-button"
              onClick={handleOpenLoginModal}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              LOGIN
            </motion.button>
          </motion.div>

          {/* Features */}
          <motion.div
            className="features-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="feature-item">
              <div className="feature-icon">🏁</div>
              <h3>4 Game Modes</h3>
              <p>One Way, Two Way, Timebomb, Sprint</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🏆</div>
              <h3>Global Leaderboard</h3>
              <p>Compete with drivers worldwide</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🚗</div>
              <h3>Car Marketplace</h3>
              <p>Collect and upgrade your fleet</p>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="login-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <p className="copyright">© 2025 Kult Games</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          open={showLoginModal}
          onClose={() => {
            console.log('[Login] Closing login modal');
            setShowLoginModal(false);
          }}
          logoSrc=""
        />
      )}
    </div>
  );
}
