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

  const gameModeNames = {
    oneWay: 'One Way',
    twoWay: 'Two Way',
    speedRun: 'Speed Run',
    timeBomb: 'Time Bomb'
  };

  // Get Unity build URL from config
  const unityBuildUrl = UNITY_BUILDS.gameModes[gameMode];

  useEffect(() => {
    // Loading will be handled by iframe onLoad
    setIsLoading(true);
  }, [gameMode]);

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
        </div>

        <button className="fullscreen-btn" onClick={handleFullscreen}>
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>
      </motion.div>

      {/* Unity Game Container */}
      <div id="unity-game-container" className="unity-game-container">
        {isLoading && (
          <div className="game-loading">
            <div className="loading-spinner"></div>
            <p>Loading {gameModeNames[gameMode]}...</p>
          </div>
        )}
        
        <iframe
          src={unityBuildUrl}
          title={`Highway Hustle - ${gameModeNames[gameMode]}`}
          className="unity-game-iframe"
          allow="autoplay; fullscreen; encrypted-media; gyroscope; accelerometer"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}