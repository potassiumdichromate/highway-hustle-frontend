import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Maximize, Minimize } from 'lucide-react';
import UNITY_BUILDS from '../config/unityBuilds';
import './Game.css';

export default function Game() {
  const { gameMode } = useParams();
  const navigate = useNavigate();
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
      // Optional: Redirect to login or show error
      // navigate('/');
    }
  }, []);

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