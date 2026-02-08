import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Maximize, Minimize } from 'lucide-react';
import { useBlockchainToast } from '../context/BlockchainToastContext'; // ADD THIS
import UNITY_BUILDS from '../config/unityBuilds';
import './Game.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://highway-hustle-backend.onrender.com/api';

export default function Game() {
  const { gameMode } = useParams();
  const navigate = useNavigate();
  const { showToast } = useBlockchainToast(); // ADD THIS HOOK
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);

  const gameModeNames = {
    oneWay: 'One Way',
    twoWay: 'Two Way',
    speedRun: 'Speed Run',
    timeBomb: 'Time Bomb'
  };

  // Get wallet address from localStorage on component mount
  useEffect(() => {
    const wallet = localStorage.getItem('walletAddress');
    
    if (wallet) {
      console.log('✅ Wallet address found:', wallet);
      setWalletAddress(wallet);
    } else {
      console.warn('⚠️ No wallet address found in localStorage');
    }
  }, []);

  // NEW: Load player data and show blockchain toast when game starts
  useEffect(() => {
    if (walletAddress) {
      loadPlayerDataAndShowToast();
    }
  }, [walletAddress]);

  const loadPlayerDataAndShowToast = async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE}/player/all?user=${walletAddress}&t=${timestamp}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Player data loaded for game:', data.data);
        
        // Show toast if blockchain session was recorded
        if (data.blockchain?.success && data.blockchain?.txHash) {
          showToast({
            title: '🎮 Game Session Started',
            description: `Playing ${gameModeNames[gameMode]} - Session tracked on blockchain`,
            txHash: data.blockchain.txHash,
            duration: 6000
          });
        } else if (data.blockchain) {
          // Blockchain recording attempted but failed
          showToast({
            title: '🎮 Game Session Started',
            description: `Playing ${gameModeNames[gameMode]}`,
            txHash: null,
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error('❌ Error loading player data:', error);
    }
  };

  // Get Unity build URL from config and append wallet parameter
  const getUnityBuildUrl = () => {
    const baseUrl = UNITY_BUILDS.gameModes[gameMode];
    
    if (!baseUrl) {
      console.error('❌ Invalid game mode:', gameMode);
      return '';
    }

    if (!walletAddress) {
      console.warn('⚠️ Wallet address not available yet');
      return baseUrl;
    }

    // Append wallet address as query parameter
    const separator = baseUrl.includes('?') ? '&' : '?';
    const fullUrl = `${baseUrl}${separator}wallet=${encodeURIComponent(walletAddress)}`;
    
    console.log('🎮 Unity build URL with wallet:', fullUrl);
    return fullUrl;
  };

  useEffect(() => {
    // Loading will be handled by iframe onLoad
    setIsLoading(true);
  }, [gameMode, walletAddress]);

  const handleFullscreen = () => {
    const container = document.getElementById('unity-game-container');
    
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // NEW: Listen for messages from Unity game
  useEffect(() => {
    const handleUnityMessage = (event) => {
      // Verify origin for security (replace with your Unity build domain)
      // if (event.origin !== 'https://your-unity-build-domain.com') return;
      
      try {
        const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Handle blockchain events from Unity
        if (message.type === 'BLOCKCHAIN_EVENT') {
          console.log('🎮 Unity blockchain event:', message);
          
          switch (message.action) {
            case 'SCORE_UPDATED':
              showToast({
                title: '🏆 Score Updated',
                description: `New high score: ${message.score}`,
                txHash: message.txHash || null,
                duration: 5000
              });
              break;
              
            case 'CURRENCY_EARNED':
              showToast({
                title: '💰 Coins Earned',
                description: `Earned ${message.amount} Highway Coins`,
                txHash: message.txHash || null,
                duration: 5000
              });
              break;
              
            case 'ACHIEVEMENT_UNLOCKED':
              showToast({
                title: '🎖️ Achievement Unlocked',
                description: message.achievementName || 'New achievement!',
                txHash: message.txHash || null,
                duration: 7000
              });
              break;
              
            case 'SESSION_ENDED':
              showToast({
                title: '🏁 Game Session Ended',
                description: 'Session data recorded on blockchain',
                txHash: message.txHash || null,
                duration: 6000
              });
              break;
              
            default:
              console.log('Unknown blockchain event:', message.action);
          }
        }
      } catch (error) {
        console.error('Error handling Unity message:', error);
      }
    };

    window.addEventListener('message', handleUnityMessage);
    
    return () => {
      window.removeEventListener('message', handleUnityMessage);
    };
  }, [showToast, gameModeNames, gameMode]);

  // Don't render iframe until we have wallet address
  const unityUrl = getUnityBuildUrl();
  const canLoadGame = walletAddress && unityUrl;

  return (
    <div className="game-page">
      {/* Top Bar */}
      <motion.div
        className="game-top-bar"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button className="back-btn" onClick={() => navigate('/license')}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="game-mode-title">
          <h2>{gameModeNames[gameMode] || 'Game'}</h2>
          {walletAddress && (
            <span className="wallet-indicator">
              {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
            </span>
          )}
        </div>

        <button className="fullscreen-btn" onClick={handleFullscreen}>
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>
      </motion.div>

      {/* Unity Game Container */}
      <div id="unity-game-container" className="unity-game-container">
        {!canLoadGame && (
          <div className="game-loading">
            <div className="loading-spinner"></div>
            <p>Initializing game...</p>
            {!walletAddress && <p className="error-text">Waiting for wallet connection...</p>}
          </div>
        )}

        {isLoading && canLoadGame && (
          <div className="game-loading">
            <div className="loading-spinner"></div>
            <p>Loading {gameModeNames[gameMode]}...</p>
          </div>
        )}
        
        {canLoadGame && (
          <iframe
            src={unityUrl}
            title={`Highway Hustle - ${gameModeNames[gameMode]}`}
            className="unity-game-iframe"
            allow="autoplay; fullscreen; encrypted-media; gyroscope; accelerometer"
            onLoad={() => setIsLoading(false)}
          />
        )}
      </div>
    </div>
  );
}