import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Maximize, Minimize } from 'lucide-react';
import { useBlockchainToast } from '../context/BlockchainToastContext';
import UNITY_BUILDS from '../config/unityBuilds';
import './Game.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://highway-hustle-backend.onrender.com/api';

export default function Game() {
  const { gameMode } = useParams();
  const navigate = useNavigate();
  const { showToast } = useBlockchainToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);
  const [hasCalledApi, setHasCalledApi] = useState(false); // Track if API was called

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
      navigate('/license'); // Redirect if no wallet
    }
  }, [navigate]);

  // Call API when wallet address is available (game starts)
  useEffect(() => {
    if (walletAddress && !hasCalledApi) {
      console.log('🎮 Game starting - calling API...');
      callGameStartApi();
      setHasCalledApi(true);
    }
  }, [walletAddress, hasCalledApi]);

  const callGameStartApi = async () => {
    try {
      const timestamp = Date.now();
      const apiUrl = `${API_BASE}/player/all?user=${walletAddress}&t=${timestamp}`;
      
      console.log('📡 Calling API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const data = await response.json();
      
      console.log('✅ API Response:', data);
      
      if (data.success) {
        // Show toast based on blockchain response
        if (data.blockchain?.success && data.blockchain?.txHash) {
          console.log('🔗 Blockchain transaction successful:', data.blockchain.txHash);
          
          showToast({
            title: '🎮 Game Session Started',
            description: `Playing ${gameModeNames[gameMode]} - Session recorded on blockchain`,
            txHash: data.blockchain.txHash,
            duration: 6000
          });
        } else if (data.blockchain) {
          console.log('⚠️ Blockchain recording attempted but failed:', data.blockchain.error);
          
          showToast({
            title: '🎮 Game Session Started',
            description: `Playing ${gameModeNames[gameMode]}`,
            txHash: null,
            duration: 5000
          });
        } else {
          console.log('ℹ️ No blockchain data in response');
          
          showToast({
            title: '🎮 Game Session Started',
            description: `Playing ${gameModeNames[gameMode]}`,
            txHash: null,
            duration: 4000
          });
        }
      } else {
        console.error('❌ API call failed:', data.error);
        
        showToast({
          title: '⚠️ Session Warning',
          description: 'Could not record game session',
          txHash: null,
          duration: 4000
        });
      }
    } catch (error) {
      console.error('❌ Error calling game start API:', error);
      
      showToast({
        title: '❌ Connection Error',
        description: 'Failed to connect to server',
        txHash: null,
        duration: 4000
      });
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
            onLoad={() => {
              console.log('🎮 Unity game loaded');
              setIsLoading(false);
            }}
          />
        )}
      </div>
    </div>
  );
}