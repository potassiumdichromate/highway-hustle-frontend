import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { motion } from 'framer-motion';
import { Zap, Wallet } from 'lucide-react';
import SynthwaveBackground from '../components/SynthwaveBackground';
import './Login.css';

export default function Login() {
  const { connectWallet, isConnecting, error, isConnected } = useWallet();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isConnected) {
      navigate('/license');
    }
  }, [isConnected, navigate]);

  const handleConnect = async () => {
    await connectWallet();
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
            <p className="game-subtitle">EVERY MILE MATTERS</p>
          </motion.div>

          {/* Connection Card */}
          <motion.div
            className="connect-card glass-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="connect-card-header">
              <Wallet size={40} className="wallet-icon" />
              <h2>Connect Your Wallet</h2>
              <p>Link your MetaMask to access the Highway</p>
            </div>

            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <p>{error}</p>
              </motion.div>
            )}

            <motion.button
              className="connect-button"
              onClick={handleConnect}
              disabled={isConnecting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isConnecting ? (
                <span className="connecting-text">
                  <span className="spinner"></span>
                  CONNECTING...
                </span>
              ) : (
                <>
                  <Wallet size={24} />
                  CONNECT METAMASK
                </>
              )}
            </motion.button>

            <div className="wallet-info">
              <p className="info-text">
                Don't have MetaMask?{' '}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="metamask-link"
                >
                  Install here
                </a>
              </p>
            </div>
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
            <p className="copyright">© 2025 FrameX Corporation • Built on Blockchain</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
