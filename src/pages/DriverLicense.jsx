import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Car,
  Trophy,
  Users,
  MessageCircle,
  ShoppingCart,
  Play,
  Target,
  Bot,
  LogOut,
  Lock,
  Zap,
  TrendingUp,
  Award,
  Settings,
  Edit2,
  Upload,
  RefreshCw
} from 'lucide-react';
import SynthwaveBackground from '../components/SynthwaveBackground';
import { logout as clearAuth } from '../api/auth';
import './DriverLicense.css';

// Import game assets
import CoinIcon from '../assets/coin.png';
import OneWayIcon from '../assets/OneWay.png';
import TwoWayIcon from '../assets/TwoWay.png';
import SpeedRunIcon from '../assets/SpeedRun.png';
import TimeBombIcon from '../assets/TimeBomb.png';

// Import car images
import CoupeImg from '../assets/coupe.png';
import CTRImg from '../assets/ctr.png';
import JeepImg from '../assets/jeep.png';
import PickupImg from '../assets/pickup.png';
import SUVImg from '../assets/suv.png';
import LamborghiniImg from '../assets/lamborghini.png';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://highway-hustle-backend.onrender.com/api';


// Car mapping based on backend indices
const CAR_DATA = {
  0: { name: 'Coupe', image: CoupeImg, rarity: 'Common' },
  5: { name: 'Pickup', image: PickupImg, rarity: 'Common' },
  6: { name: 'SUV', image: SUVImg, rarity: 'Rare' },
  8: { name: 'Jeep', image: JeepImg, rarity: 'Epic' },
  10: { name: 'Lamborghini', image: LamborghiniImg, rarity: 'Legendary' },
  11: { name: 'CTR', image: CTRImg, rarity: 'Legendary' }
};

// Get car name from index
const getCarName = (index) => {
  return CAR_DATA[index]?.name || 'Unknown';
};

export default function DriverLicense() {
  const { account, disconnectWallet } = useWallet();
  const { logout: privyLogout } = usePrivy();
  const navigate = useNavigate();
  
  // State management
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedGameMode, setSelectedGameMode] = useState('oneWay');
  const [chatMessages] = useState([
    { id: 1, user: 'SpeedDemon', message: 'Anyone up for a race?', time: '2m ago' },
    { id: 2, user: 'NightRider', message: 'GG everyone! 🏆', time: '5m ago' }
  ]);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [garageOpen, setGarageOpen] = useState(false);
  const [gameModeSelectOpen, setGameModeSelectOpen] = useState(false);
  
  // Backend data state
  const [playerData, setPlayerData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leaderboardType, setLeaderboardType] = useState('global');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Get wallet address
  const walletAddress = account || localStorage.getItem('walletAddress');

  // Load player data from backend
  useEffect(() => {
    if (walletAddress) {
      loadPlayerData();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      loadLeaderboard(leaderboardType);
    }
  }, [walletAddress, leaderboardType]);

  const loadPlayerData = async () => {
    try {
      setIsLoading(true);
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE}/player/all?user=${walletAddress}&t=${timestamp}`);
      const data = await response.json();
      
      if (data.success) {
        setPlayerData(data.data);
        console.log('✅ Player data loaded:', data.data);
      } else {
        console.error('❌ Failed to load player data');
      }
    } catch (error) {
      console.error('❌ Error loading player data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeaderboard = async (type = leaderboardType) => {
    try {
      setLeaderboardLoading(true);
      const timestamp = Date.now();
      const endpoint =
        type === 'gate'
          ? `${API_BASE}/leaderboard/gate-wallet`
          : `${API_BASE}/leaderboard`;
      const response = await fetch(`${endpoint}?t=${timestamp}`);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboardData(data.leaderboard);
        console.log(`✅ ${type === 'gate' ? 'Gate wallet' : 'Global'} leaderboard loaded`);
      } else {
        console.error(`❌ Failed to load ${type} leaderboard`);
      }
    } catch (error) {
      console.error(`❌ Error loading ${type} leaderboard:`, error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPlayerData();
    await loadLeaderboard(leaderboardType);
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    console.log('[DriverLicense] Logout requested');
    
    try {
      clearAuth();
      console.log('[DriverLicense] Auth cleared');
    } catch (err) {
      console.warn('[DriverLicense] Auth clear failed', err);
    }

    try {
      if (privyLogout) {
        await privyLogout();
        console.log('[DriverLicense] Privy logout succeeded');
      }
    } catch (err) {
      console.warn('[DriverLicense] Privy logout failed', err);
    }

    try {
      disconnectWallet();
      console.log('[DriverLicense] Wallet disconnected');
    } catch (err) {
      console.warn('[DriverLicense] Wallet disconnect failed', err);
    }

    try {
      localStorage.removeItem('sessionWallet');
      localStorage.removeItem('privySession');
      localStorage.removeItem('privyUser');
      localStorage.removeItem('walletAddress');
      console.log('[DriverLicense] LocalStorage cleared');
    } catch (err) {
      console.warn('[DriverLicense] LocalStorage clear failed', err);
    }

    console.log('[DriverLicense] Navigating to login page');
    navigate('/', { replace: true });
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={20} /> },
    { id: 'garage', label: 'My Garage', icon: <Car size={20} /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={20} /> },
    { id: 'marketplace', label: 'Marketplace', icon: <ShoppingCart size={20} /> },
    { id: 'missions', label: 'Missions', icon: <Target size={20} /> },
    { id: 'friends', label: 'Friends', icon: <Users size={20} /> },
    { id: 'chat', label: 'Global Chat', icon: <MessageCircle size={20} /> }
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your data...</p>
        </div>
      );
    }

    if (!playerData) {
      return (
        <div className="error-container">
          <p>Failed to load player data</p>
          <button onClick={loadPlayerData}>Retry</button>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return <OverviewSection playerData={playerData} walletAddress={walletAddress} onRefresh={handleRefresh} />;
      case 'garage':
        return <GarageSection playerData={playerData} />;
      case 'leaderboard':
        return (
          <LeaderboardSection
            selectedGameMode={selectedGameMode}
            setSelectedGameMode={setSelectedGameMode}
            leaderboardData={leaderboardData}
            playerData={playerData}
            leaderboardType={leaderboardType}
            onLeaderboardTypeChange={setLeaderboardType}
            isLoading={leaderboardLoading}
          />
        );
      case 'marketplace':
        return <MarketplaceSection />;
      case 'missions':
        return <MissionsSection playerData={playerData} onRefresh={handleRefresh} />;
      case 'friends':
        return <FriendsSection />;
      case 'chat':
        return <ChatSection messages={chatMessages} />;
      default:
        return <OverviewSection playerData={playerData} walletAddress={walletAddress} onRefresh={handleRefresh} />;
    }
  };

  return (
    <div className="driver-license-page">
      <SynthwaveBackground />
      <div className="grain-overlay" />

      {/* Top Bar */}
      <motion.div
        className="top-bar"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="top-bar-left">
          <Zap className="logo-icon" size={28} />
          <div className="brand">
            <h1>HIGHWAY HUSTLE</h1>
            <span>Driver's License</span>
          </div>
        </div>

        <div className="top-bar-right">
          <button 
            className="icon-btn" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh data"
          >
            <RefreshCw size={20} className={isRefreshing ? 'spinning' : ''} />
          </button>
          <div className="wallet-badge">
            <User size={18} />
            <span>{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
          </div>
          <button className="icon-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </motion.div>

      {/* Main Dashboard */}
      <div className="dashboard-wrapper">
        {/* Sidebar */}
        <motion.aside
          className="sidebar"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <nav className="nav-menu">
            {sections.map((section, index) => (
              <motion.button
                key={section.id}
                className={`nav-btn ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ x: 5 }}
              >
                {section.icon}
                <span>{section.label}</span>
              </motion.button>
            ))}
          </nav>

          {/* My Garage Button */}
          <motion.button
            className="garage-btn"
            onClick={() => setGarageOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Car size={20} />
            <span>MY GARAGE</span>
          </motion.button>

          {/* Start Race Button */}
          <motion.button
            className="play-btn"
            onClick={() => setGameModeSelectOpen(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="play-btn-content">
              <Play size={24} fill="#fff" />
              <div className="play-btn-text">
                <span className="play-btn-main">START RACE</span>
                <span className="play-btn-sub">Hit the highway</span>
              </div>
            </div>
            <div className="play-btn-glow"></div>
          </motion.button>
        </motion.aside>

        {/* Content Area */}
        <main className="content-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* AI Chatbot */}
      <motion.button
        className="ai-fab"
        onClick={() => setAiChatOpen(!aiChatOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
      >
        <Bot size={28} />
      </motion.button>

      <AnimatePresence>
        {aiChatOpen && (
          <motion.div
            className="ai-panel"
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="ai-panel-header">
              <Bot size={22} />
              <h3>AI Assistant</h3>
              <button onClick={() => setAiChatOpen(false)}>×</button>
            </div>
            <div className="ai-panel-content">
              <p>Coming soon! I'll help you with:</p>
              <ul>
                <li>Race strategies</li>
                <li>Car recommendations</li>
                <li>Mission tips</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Garage Modal */}
      <AnimatePresence>
        {garageOpen && (
          <GarageModal onClose={() => setGarageOpen(false)} walletAddress={walletAddress} />
        )}
      </AnimatePresence>

      {/* Game Mode Selection Modal */}
      <AnimatePresence>
        {gameModeSelectOpen && (
          <GameModeSelector onClose={() => setGameModeSelectOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Garage Modal Component
function GarageModal({ onClose, walletAddress }) {
  // Update with your actual R2 garage URL
  const garageUrl = `https://your-r2-bucket.r2.dev/Garage/index.html?wallet=${walletAddress}`;

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content garage-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Car size={28} />
            <h2>MY GARAGE</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="unity-container">
          <iframe
            src={garageUrl}
            title="Garage"
            className="unity-iframe"
            allow="autoplay; fullscreen; encrypted-media"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// Game Mode Selector Modal Component
function GameModeSelector({ onClose }) {
  const navigate = useNavigate();

  const gameModes = [
    {
      id: 'oneWay',
      name: 'One Way',
      icon: OneWayIcon,
      description: 'Classic endless highway racing',
      difficulty: 'Easy'
    },
    {
      id: 'twoWay',
      name: 'Two Way',
      icon: TwoWayIcon,
      description: 'Dodge oncoming traffic',
      difficulty: 'Medium'
    },
    {
      id: 'speedRun',
      name: 'Speed Run',
      icon: SpeedRunIcon,
      description: 'Short burst speed challenges',
      difficulty: 'Hard'
    },
    {
      id: 'timeBomb',
      name: 'Time Bomb',
      icon: TimeBombIcon,
      description: 'Race against the clock',
      difficulty: 'Expert'
    }
  ];

  const handleModeSelect = (modeId) => {
    navigate(`/game/${modeId}`);
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content game-mode-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Play size={28} />
            <h2>SELECT GAME MODE</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="game-modes-grid-modal">
          {gameModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              className="game-mode-option"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => handleModeSelect(mode.id)}
            >
              <div className="mode-icon-large">
                <img src={mode.icon} alt={mode.name} className="mode-icon-img-large" />
              </div>
              <h3>{mode.name}</h3>
              <p className="mode-description">{mode.description}</p>
              <div className={`difficulty-badge ${mode.difficulty.toLowerCase()}`}>
                {mode.difficulty}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Section Components
function OverviewSection({ playerData, walletAddress, onRefresh }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(playerData?.userGameData?.playerName || 'Unnamed');
  const [tempName, setTempName] = useState(displayName);
  const [isSavingName, setIsSavingName] = useState(false);

  // Update display name when playerData changes
  useEffect(() => {
    if (playerData?.userGameData?.playerName) {
      setDisplayName(playerData.userGameData.playerName);
      setTempName(playerData.userGameData.playerName);
    }
  }, [playerData]);

  const handleSaveName = async () => {
    if (!tempName || tempName === displayName) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE}/player/game?user=${walletAddress}&t=${timestamp}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: tempName })
      });

      const data = await response.json();
      if (data.success) {
        setDisplayName(tempName);
        setIsEditingName(false);
        console.log('✅ Player name updated');
        onRefresh(); // Refresh data
      }
    } catch (error) {
      console.error('❌ Error updating player name:', error);
    } finally {
      setIsSavingName(false);
    }
  };

  // Calculate stats from backend data
  const stats = {
    totalScore: (playerData?.playerGameModeData?.bestScoreOneWay || 0) + 
                (playerData?.playerGameModeData?.bestScoreTwoWay || 0) + 
                (playerData?.playerGameModeData?.bestScoreTimeAttack || 0) + 
                (playerData?.playerGameModeData?.bestScoreBomb || 0),
    currency: playerData?.userGameData?.currency || 0,
    totalPlayedTime: playerData?.userGameData?.totalPlayedTime || 0
  };

  // Game mode stats from backend
  const gameModeStats = {
    oneWay: {
      bestScore: playerData?.playerGameModeData?.bestScoreOneWay || 0,
      timePlayed: formatPlayTime(playerData?.userGameData?.totalPlayedTime || 0)
    },
    twoWay: {
      bestScore: playerData?.playerGameModeData?.bestScoreTwoWay || 0,
      timePlayed: formatPlayTime(playerData?.userGameData?.totalPlayedTime || 0)
    },
    speedRun: {
      bestScore: playerData?.playerGameModeData?.bestScoreTimeAttack || 0,
      timePlayed: formatPlayTime(playerData?.userGameData?.totalPlayedTime || 0)
    },
    timeBomb: {
      bestScore: playerData?.playerGameModeData?.bestScoreBomb || 0,
      timePlayed: formatPlayTime(playerData?.userGameData?.totalPlayedTime || 0)
    }
  };

  // Vehicle stats - SIMPLIFIED to just show selected car
  const selectedCarIndex = playerData?.playerVehicleData?.selectedPlayerCarIndex || 0;
  const vehicleStats = {
    selected: getCarName(selectedCarIndex)
  };

  // Calculate level from total score
  const level = Math.floor(stats.totalScore / 1000) + 1;

  return (
    <div className="section">
      <h2 className="section-title">DRIVER PROFILE</h2>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="avatar-box">
          <div className="avatar">
            <User size={48} />
          </div>
          <button className="avatar-edit">
            <Upload size={14} />
          </button>
        </div>

        <div className="profile-info">
          {isEditingName ? (
            <div className="name-edit">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                autoFocus
                maxLength={20}
                disabled={isSavingName}
              />
              <button onClick={handleSaveName} disabled={isSavingName}>
                {isSavingName ? '...' : '✓'}
              </button>
              <button onClick={() => { setTempName(displayName); setIsEditingName(false); }} disabled={isSavingName}>
                ×
              </button>
            </div>
          ) : (
            <div className="name-display">
              <h3>{displayName}</h3>
              <button onClick={() => setIsEditingName(true)}>
                <Edit2 size={16} />
              </button>
            </div>
          )}
          <p className="rank">Elite Racer</p>
        </div>

        <div className="level-badge">
          <span className="level-label">LVL</span>
          <span className="level-num">{level}</span>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="stats-row">
        <StatBox icon={<Trophy />} label="Total Score" value={stats.totalScore.toLocaleString()} />
        <StatBox 
          icon={<img src={CoinIcon} alt="Highway Coins" className="stat-coin-icon" />} 
          label="Highway Coins" 
          value={stats.currency.toLocaleString()} 
        />
        <StatBox icon={<TrendingUp />} label="Level" value={level} />
        <StatBox icon={<Zap />} label="Play Time" value={formatPlayTime(stats.totalPlayedTime)} />
      </div>

      {/* Game Mode Stats */}
      <div className="game-modes-section">
        <h3 className="subsection-title">GAME MODE STATISTICS</h3>
        <div className="game-modes-grid">
          <GameModeCard 
            title="One Way" 
            icon="🏁"
            iconImage={OneWayIcon}
            stats={gameModeStats.oneWay}
          />
          <GameModeCard 
            title="Two Way" 
            icon="⚡"
            iconImage={TwoWayIcon}
            stats={gameModeStats.twoWay}
          />
          <GameModeCard 
            title="Speed Run" 
            icon="🚀"
            iconImage={SpeedRunIcon}
            stats={gameModeStats.speedRun}
          />
          <GameModeCard 
            title="Time Bomb" 
            icon="💣"
            iconImage={TimeBombIcon}
            stats={gameModeStats.timeBomb}
          />
        </div>
      </div>

      {/* Vehicle Stats - SIMPLIFIED */}
      <div className="vehicle-section">
        <h3 className="subsection-title">VEHICLE GARAGE</h3>
        <div className="vehicle-card">
          <div className="vehicle-header">
            <Car size={32} />
            <h4>Current Vehicle: {vehicleStats.selected}</h4>
          </div>
          <p style={{ textAlign: 'center', marginTop: '1rem', opacity: 0.7 }}>
            Visit "My Garage" to view all vehicles
          </p>
        </div>
      </div>

      {/* XP Progress */}
      <div className="xp-section">
        <div className="xp-header">
          <span>Total Score Progress</span>
          <span>{stats.totalScore.toLocaleString()} pts</span>
        </div>
        <div className="xp-bar-container">
          <div className="xp-bar" style={{ width: `${Math.min((stats.totalScore % 10000) / 100, 100)}%` }}></div>
        </div>
      </div>
    </div>
  );
}

function GameModeCard({ title, icon, stats, iconImage }) {
  return (
    <motion.div 
      className="game-mode-card"
      whileHover={{ y: -5 }}
    >
      <div className="mode-header">
        {iconImage ? (
          <img src={iconImage} alt={title} className="mode-icon-img" />
        ) : (
          <span className="mode-icon">{icon}</span>
        )}
        <h4>{title}</h4>
      </div>
      <div className="mode-stats">
        <div className="mode-stat">
          <span className="stat-label">Best Score</span>
          <span className="stat-value">{stats.bestScore.toLocaleString()}</span>
        </div>
        <div className="mode-stat">
          <span className="stat-label">Time Played</span>
          <span className="stat-value">{stats.timePlayed}</span>
        </div>
      </div>
    </motion.div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <motion.div className="stat-box" whileHover={{ y: -5 }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-data">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
    </motion.div>
  );
}

// UPDATED GarageSection - ALL CARS SHOW IMAGES, ONLY SELECTED IS EQUIPPED
function GarageSection({ playerData }) {
  const [selectedCarIndex, setSelectedCarIndex] = useState(playerData?.playerVehicleData?.selectedPlayerCarIndex || 0);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // Get wallet address from localStorage
  const walletAddress = localStorage.getItem('walletAddress');

  console.log('🚗 Selected car index from API:', selectedCarIndex);

  // Update selectedCarIndex when playerData changes
  useEffect(() => {
    if (playerData?.playerVehicleData?.selectedPlayerCarIndex !== undefined) {
      setSelectedCarIndex(playerData.playerVehicleData.selectedPlayerCarIndex);
    }
  }, [playerData]);

  // Handle car selection
  const handleSelectCar = async (carIndex) => {
    if (carIndex === selectedCarIndex || isSelecting) {
      return; // Already selected or currently selecting
    }

    setIsSelecting(true);
    console.log(`🚗 Selecting car index: ${carIndex}`);

    try {
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE}/player/vehicle?user=${walletAddress}&t=${timestamp}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          selectedPlayerCarIndex: carIndex 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedCarIndex(carIndex);
        console.log(`✅ Car selected successfully: ${CAR_DATA[carIndex].name} (index ${carIndex})`);
        
        // Optional: Show success message
        // You can add a toast notification here if you want
      } else {
        console.error('❌ Failed to select car:', data);
        alert('Failed to select car. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error selecting car:', error);
      alert('Error selecting car. Please check your connection.');
    } finally {
      setIsSelecting(false);
    }
  };

  // Build cars array from CAR_DATA - ALL cars available
  const cars = Object.keys(CAR_DATA).map(index => {
    const carIndex = parseInt(index);
    return {
      id: carIndex,
      name: CAR_DATA[carIndex].name,
      image: CAR_DATA[carIndex].image,
      rarity: CAR_DATA[carIndex].rarity
    };
  });

  return (
    <div className="section">
      <h2 className="section-title">MY GARAGE</h2>
      <p className="section-subtitle">Select your vehicle for the next race</p>
      
      <div className="cars-grid">
        {cars.map((car, index) => {
          const isSelected = selectedCarIndex === car.id;
          
          return (
            <motion.div
              key={car.id}
              className={`car-box ${isSelected ? 'selected' : ''} ${isSelecting ? 'selecting' : ''}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: isSelected ? 0 : -8 }}
            >
              {/* Rarity tag */}
              <span className={`rarity-tag ${car.rarity.toLowerCase()}`}>{car.rarity}</span>
              
              {/* Selected tag if this is the equipped car */}
              {isSelected && <span className="selected-tag">SELECTED</span>}
              
              {/* ALWAYS show car image */}
              <div className="car-visual">
                <img src={car.image} alt={car.name} className="car-image" />
              </div>
              
              <h3>{car.name}</h3>
              
              {/* Button - EQUIPPED if selected, SELECT with click handler otherwise */}
              {isSelected ? (
                <button className="select-btn active" disabled>
                  EQUIPPED
                </button>
              ) : (
                <button 
                  className="select-btn" 
                  onClick={() => handleSelectCar(car.id)}
                  disabled={isSelecting}
                >
                  {isSelecting ? 'SELECTING...' : 'SELECT'}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardSection({
  selectedGameMode,
  setSelectedGameMode,
  leaderboardData,
  playerData,
  leaderboardType,
  onLeaderboardTypeChange,
  isLoading
}) {
  const tabs = [
    { key: 'global', label: 'Global Leaderboard', help: 'Top Highway Hustle players' },
    { key: 'gate', label: 'Gate Wallet Leaderboard', help: 'Only gate_wallet sign-ins' }
  ];
  const title = leaderboardType === 'gate' ? 'Gate Wallet Leaderboard' : 'Global Leaderboard';
  const subtitle =
    leaderboardType === 'gate'
      ? 'Gate wallet users ranked by Highway Coins'
      : 'Top players by Highway Coins';
  const transformedLeaderboard = leaderboardData?.slice(0, 10).map((player, index) => ({
    rank: index + 1,
    player: player.userGameData?.playerName || 'Unnamed',
    score: player.userGameData?.currency || 0,
    address: player.privyData?.walletAddress
      ? `${player.privyData.walletAddress.slice(0, 6)}...${player.privyData.walletAddress.slice(-4)}`
      : player.privyData?.discord || player.privyData?.email || 'Unknown'
  })) || [];
  const hasEntries = transformedLeaderboard.length > 0;

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>
      <p className="section-subtitle">{subtitle}</p>
      <div className="leaderboard-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`leaderboard-tab ${leaderboardType === tab.key ? 'active' : ''}`}
            onClick={() => onLeaderboardTypeChange(tab.key)}
          >
            <span>{tab.label}</span>
            <small>{tab.help}</small>
          </button>
        ))}
      </div>

      <div className="leaderboard-list">
        {isLoading ? (
          <div className="no-data">
            <p>Loading leaderboard...</p>
          </div>
        ) : hasEntries ? (
          transformedLeaderboard.map((entry, index) => (
            <motion.div
              key={`${leaderboardType}-${entry.rank}`}
              className={`lb-entry rank-${entry.rank}`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <div className="rank-num">#{entry.rank}</div>
              <div className="player-data">
                <span className="player-name">{entry.player}</span>
                <span className="player-addr">{entry.address}</span>
              </div>
              <div className="score">
                <img src={CoinIcon} alt="Highway Coins" className="lb-coin-icon" />
                {entry.score.toLocaleString()}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="no-data">
            <p>No entries available for this leaderboard yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketplaceSection() {
  return (
    <div className="section">
      <h2 className="section-title">CAR MARKETPLACE</h2>
      <div className="coming-soon">
        <ShoppingCart size={64} />
        <h3>Marketplace Opening Soon</h3>
        <p>Buy, sell, and trade exclusive vehicles!</p>
      </div>
    </div>
  );
}

function MissionsSection({ playerData, onRefresh }) {
  const achieved1000M = playerData?.campaignData?.Achieved1000M || false;

  const missions = [
    {
      id: 1,
      title: 'Reach 1000 Meters',
      description: 'Drive 1000 meters in any game mode',
      progress: achieved1000M ? 1 : 0,
      total: 1,
      reward: 1000,
      completed: achieved1000M
    }
  ];

  return (
    <div className="section">
      <h2 className="section-title">ACTIVE MISSIONS</h2>
      <div className="missions-list">
        {missions.map((mission, index) => (
          <motion.div
            key={mission.id}
            className={`mission-box ${mission.completed ? 'completed' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="mission-head">
              <Target size={20} />
              <div>
                <h3>{mission.title}</h3>
                <p className="mission-description">{mission.description}</p>
              </div>
              {mission.completed && <span className="completed-badge">✓ COMPLETED</span>}
            </div>
            <div className="mission-prog">
              <div className="prog-bar-bg">
                <div 
                  className="prog-bar" 
                  style={{ width: `${(mission.progress / mission.total) * 100}%` }}
                ></div>
              </div>
              <span>{mission.progress} / {mission.total}</span>
            </div>
            <div className="mission-reward">
              <Award size={16} />
              <span>{mission.reward} XP</span>
              {mission.completed && <span className="claimed-label">CLAIMED</span>}
            </div>
          </motion.div>
        ))}
      </div>
      <button className="refresh-btn" onClick={onRefresh}>
        <RefreshCw size={16} />
        Refresh Missions
      </button>
    </div>
  );
}

function FriendsSection() {
  return (
    <div className="section">
      <h2 className="section-title">FRIENDS</h2>
      <div className="coming-soon">
        <Users size={64} />
        <h3>Friends System Coming Soon</h3>
        <p>Connect with racers worldwide!</p>
      </div>
    </div>
  );
}

function ChatSection({ messages }) {
  return (
    <div className="section">
      <h2 className="section-title">GLOBAL CHAT</h2>
      <div className="chat-box">
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className="chat-msg">
              <div className="msg-head">
                <span className="msg-user">{msg.user}</span>
                <span className="msg-time">{msg.time}</span>
              </div>
              <p>{msg.message}</p>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input type="text" placeholder="Type a message..." />
          <button>SEND</button>
        </div>
      </div>
    </div>
  );
}

// Helper Functions
function formatPlayTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
