import React, { useState, useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlockchainToast } from '../context/BlockchainToastContext'; // NEW IMPORT
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
import { logout as clearAuth, apiInterceptor, getJwtWalletAddress } from '../api/auth';
import { fetchMarketplaceAssets, fetchUserPurchases, verifyPurchase } from '../api/marketplace';
import { ethers } from 'ethers';
import { usePrivyWalletTools } from '../hooks/usePrivyWalletTools';
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
import MuscleImg from '../assets/muscle.png';
import F1Img from '../assets/f1.png';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://highway-hustle-backend.onrender.com/api';

// Car mapping based on backend indices
// free = always available; marketplaceId = must be purchased in marketplace
const CAR_DATA = {
  0:  { name: 'Coupe',       image: CoupeImg,       rarity: 'Common',    free: true },
  5:  { name: 'Pickup',      image: PickupImg,       rarity: 'Common',    free: true },
  6:  { name: 'SUV',         image: SUVImg,          rarity: 'Rare',      marketplaceId: 'suv' },
  8:  { name: 'Jeep',        image: JeepImg,         rarity: 'Epic',      marketplaceId: 'jeep' },
  10: { name: 'Lamborghini', image: LamborghiniImg,  rarity: 'Legendary', marketplaceId: 'lamborghini' },
  11: { name: 'CTR',         image: CTRImg,          rarity: 'Legendary', marketplaceId: 'ctr' },
  12: { name: 'Muscle',      image: MuscleImg,       rarity: 'Epic',      marketplaceId: 'muscle' },
  13: { name: 'F1',          image: F1Img,           rarity: 'Legendary', marketplaceId: 'f1' },
};

// Get car name from index
const getCarName = (index) => {
  return CAR_DATA[index]?.name || 'Unknown';
};

export default function DriverLicense() {
  const { account, provider, disconnectWallet } = useWallet();
  const { logout: privyLogout } = usePrivy();
  const { showToast } = useBlockchainToast(); // NEW HOOK
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
  const commentPingKeyRef = useRef('');

  // JWT wallet address is authoritative for API calls (enforceAuthIdentity requires it to match).
  // Fall back to WalletContext/localStorage only for display.
  const walletAddress = getJwtWalletAddress() || account || localStorage.getItem('walletAddress');

  // Load player data — call whenever wallet is ready; token attached automatically if present
  useEffect(() => {
    if (walletAddress) {
      loadPlayerData();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress && activeSection === 'leaderboard') {
      loadLeaderboard(leaderboardType);
    }
  }, [walletAddress, leaderboardType, activeSection]);

  useEffect(() => {
    fireLeaderboardCommentPing();
  }, [activeSection, leaderboardData, leaderboardType, playerData]);

  useEffect(() => {
    const handler = (e) => setActiveSection(e.detail);
    window.addEventListener('navigate-section', handler);
    return () => window.removeEventListener('navigate-section', handler);
  }, []);

  const loadPlayerData = async () => {
    try {
      setIsLoading(true);
      const timestamp = Date.now();
      const { data } = await apiInterceptor({ url: `/player/all?user=${walletAddress}&t=${timestamp}` });
      
      if (data.success) {
        setPlayerData(data.data);
        console.log('✅ Player data loaded:', data.data);
        
        // NEW: Show toast if session was recorded on blockchain
        if (data.blockchain?.txHash) {
          showToast({
            title: '📊 Session Recorded',
            description: 'Your game session was tracked on blockchain',
            txHash: data.blockchain.txHash,
            duration: 5000
          });
        }
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
          ? `/leaderboard/gate-wallet`
          : `/leaderboard`;
      const { data } = await apiInterceptor({ url: `${endpoint}?t=${timestamp}` });
      
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

  const fireLeaderboardCommentPing = () => {
    const topPlayer = Array.isArray(leaderboardData) ? leaderboardData[0] : null;
    if (activeSection !== 'leaderboard' || !playerData || !topPlayer) return;

    const currentId =
      playerData?._id ||
      playerData?.privyData?.walletAddress ||
      walletAddress ||
      'current';
    const topId =
      topPlayer?._id ||
      topPlayer?.privyData?.walletAddress ||
      topPlayer?.userGameData?.playerName ||
      'top';
    const currentCurrency = playerData?.userGameData?.currency || 0;
    const topCurrency = topPlayer?.userGameData?.currency || 0;
    const pingKey = `${leaderboardType}:${currentId}:${currentCurrency}:${topId}:${topCurrency}`;

    if (commentPingKeyRef.current === pingKey) return;
    commentPingKeyRef.current = pingKey;

    void apiInterceptor({
      method: 'POST',
      url: '/leaderboard/comment-ping',
      data: { leaderboardType, currentPlayer: playerData, topPlayer },
    }).catch((err) => {
      // console.debug('[DriverLicense] 0G leaderboard comment ping failed', err);
    });
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
        return <GarageSection playerData={playerData} account={walletAddress} provider={provider} />;
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
  const { showToast } = useBlockchainToast(); // NEW HOOK
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(playerData?.userGameData?.playerName || 'Unnamed');
  const [tempName, setTempName] = useState(displayName);
  const [isSavingName, setIsSavingName] = useState(false);

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
      const { data } = await apiInterceptor({
        method: 'POST',
        url: `/player/game?user=${walletAddress}&t=${timestamp}`,
        data: { playerName: tempName },
      });
      if (data.success) {
        setDisplayName(tempName);
        setIsEditingName(false);
        console.log('✅ Player name updated');
        
        // NEW: Show toast notification
        showToast({
          title: '✏️ Name Updated',
          description: `Player name changed to "${tempName}"`,
          txHash: data.blockchain?.txHash || null,
          duration: 4000
        });
        
        onRefresh();
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

  const selectedCarIndex = playerData?.playerVehicleData?.selectedPlayerCarIndex || 0;
  const vehicleStats = {
    selected: getCarName(selectedCarIndex)
  };

  const level = Math.floor(stats.totalScore / 1000) + 1;
  const explorerBase = 'https://chainscan.0g.ai/address/';
  const contractEntries = [
    { key: 'SESSION', label: 'Session Contract', address: import.meta.env.VITE_SESSION_CONTRACT_ADDRESS || '' },
    { key: 'SCORE', label: 'Score Contract', address: import.meta.env.VITE_SCORE_CONTRACT_ADDRESS || '' },
    { key: 'VEHICLE', label: 'Vehicle Contract', address: import.meta.env.VITE_VEHICLE_CONTRACT_ADDRESS || '' },
    { key: 'MISSION', label: 'Mission Contract', address: import.meta.env.VITE_MISSION_CONTRACT_ADDRESS || '' },
    { key: 'ECONOMY', label: 'Economy Contract', address: import.meta.env.VITE_ECONOMY_CONTRACT_ADDRESS || '' },
  ].filter((entry) => /^0x[a-fA-F0-9]{40}$/.test(entry.address));

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

      {/* 0G Feature Visibility */}
      <div className="game-modes-section">
        <h3 className="subsection-title">0G FEATURES USED IN GAME</h3>
        <div className="game-modes-grid">
          <GameModeCard
            title="0G EVM"
            icon="⛓️"
            stats={{
              bestScore: stats.totalScore,
              timePlayed: "Session + score + vehicle events",
            }}
          />
          <GameModeCard
            title="0G DA"
            icon="🧾"
            stats={{
              bestScore: playerData?.campaignData?.Achieved1000M ? 1 : 0,
              timePlayed: "Player state snapshots",
            }}
          />
          <GameModeCard
            title="0G Compute"
            icon="🧠"
            stats={{
              bestScore: leaderboardDataSafe(playerData),
              timePlayed: "AI leaderboard commentary",
            }}
          />
          <GameModeCard
            title="0G Explorer Proof"
            icon="🔍"
            stats={{
              bestScore: 1,
              timePlayed: "On-chain verification ready",
            }}
          />
        </div>
      </div>

      {/* 0G Contract Addresses */}
      <div className="game-modes-section">
        <h3 className="subsection-title">0G CONTRACT ADDRESSES</h3>
        {contractEntries.length === 0 ? (
          <div className="vehicle-card">
            <p style={{ textAlign: 'center', opacity: 0.8 }}>
              Contract addresses are not configured in frontend env yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {contractEntries.map((entry) => {
              const shortAddress = `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`;
              return (
                <div key={entry.key} className="vehicle-card" style={{ padding: '1rem' }}>
                  <div className="vehicle-header" style={{ justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <h4>{entry.label}</h4>
                      <p style={{ opacity: 0.8, fontFamily: 'monospace', marginTop: '0.25rem' }}>{shortAddress}</p>
                    </div>
                    <a
                      href={`${explorerBase}${entry.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="select-btn"
                      style={{ minWidth: '120px', textAlign: 'center' }}
                    >
                      View on Scan
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vehicle Stats */}
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

// UPDATED GarageSection with blockchain toast + marketplace ownership
function GarageSection({ playerData, account, provider }) {
  const { showToast } = useBlockchainToast();
  const [selectedCarIndex, setSelectedCarIndex] = useState(playerData?.playerVehicleData?.selectedPlayerCarIndex || 0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [ownedIds, setOwnedIds] = useState([]);

  const walletAddress = getJwtWalletAddress() || account || localStorage.getItem('walletAddress');

  useEffect(() => {
    if (playerData?.playerVehicleData?.selectedPlayerCarIndex !== undefined) {
      setSelectedCarIndex(playerData.playerVehicleData.selectedPlayerCarIndex);
    }
  }, [playerData]);

  useEffect(() => {
    if (!walletAddress) return;
    fetchUserPurchases(walletAddress).then(setOwnedIds).catch(() => {});
  }, [walletAddress]);

  const handleSelectCar = async (carIndex) => {
    if (carIndex === selectedCarIndex || isSelecting) return;

    setIsSelecting(true);
    try {
      const timestamp = Date.now();
      const { data } = await apiInterceptor({
        method: 'POST',
        url: `/player/vehicle?user=${walletAddress}&t=${timestamp}`,
        data: { selectedPlayerCarIndex: carIndex },
      });

      if (data.success) {
        setSelectedCarIndex(carIndex);
        showToast({
          title: '🚗 Vehicle Switched',
          description: `Equipped ${CAR_DATA[carIndex].name}`,
          txHash: data.blockchain?.txHash || null,
          duration: 6000
        });
      } else {
        alert('Failed to select car. Please try again.');
      }
    } catch (error) {
      console.error('Error selecting car:', error);
      alert('Error selecting car. Please check your connection.');
    } finally {
      setIsSelecting(false);
    }
  };

  const cars = Object.keys(CAR_DATA).map(index => {
    const carIndex = parseInt(index);
    const entry = CAR_DATA[carIndex];
    const isOwned = entry.free || (entry.marketplaceId && ownedIds.includes(entry.marketplaceId));
    return {
      id: carIndex,
      name: entry.name,
      image: entry.image,
      rarity: entry.rarity,
      free: entry.free || false,
      marketplaceId: entry.marketplaceId || null,
      isOwned,
    };
  });

  return (
    <div className="section">
      <h2 className="section-title">MY GARAGE</h2>
      <p className="section-subtitle">Select your vehicle for the next race</p>

      <div className="cars-grid">
        {cars.map((car, index) => {
          const isSelected = selectedCarIndex === car.id;
          const locked = !car.isOwned;

          return (
            <motion.div
              key={car.id}
              className={`car-box ${isSelected ? 'selected' : ''} ${locked ? 'locked' : ''} ${isSelecting ? 'selecting' : ''}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: isSelected || locked ? 0 : -8 }}
            >
              <span className={`rarity-tag ${car.rarity.toLowerCase()}`}>{car.rarity}</span>
              {isSelected && !locked && <span className="selected-tag">SELECTED</span>}
              {locked && <span className="locked-tag">LOCKED</span>}

              <div className={`car-visual ${locked ? 'car-visual--locked' : ''}`}>
                <img src={car.image} alt={car.name} className="car-image" style={locked ? { filter: 'grayscale(1) opacity(0.45)' } : {}} />
                {locked && (
                  <div className="lock-overlay">🔒</div>
                )}
              </div>

              <h3>{car.name}</h3>

              {locked ? (
                <button
                  className="select-btn locked-btn"
                  onClick={() => {
                    // Switch to marketplace tab
                    const event = new CustomEvent('navigate-section', { detail: 'marketplace' });
                    window.dispatchEvent(event);
                  }}
                >
                  BUY IN MARKETPLACE
                </button>
              ) : isSelected ? (
                <button className="select-btn active" disabled>EQUIPPED</button>
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
  const [aiComment, setAiComment] = useState(null);
  const [aiCommentLoading, setAiCommentLoading] = useState(false);
  const [computeHighlightState, setComputeHighlightState] = useState('idle');
  const aiCommentKeyRef = useRef('');
  const computeSuccessTimerRef = useRef(null);

  const walletAddress = playerData?.privyData?.walletAddress || localStorage.getItem('walletAddress');

  const fetchAiComment = async (forceRefresh = false) => {
    if (!walletAddress || !leaderboardData?.length || !playerData) return;

    const topPlayer = leaderboardData[0];
    const currentCurrency = playerData?.userGameData?.currency || 0;
    const topCurrency = topPlayer?.userGameData?.currency || 0;
    const commentKey = `${leaderboardType}:${walletAddress}:${currentCurrency}:${topCurrency}`;

    if (!forceRefresh && aiCommentKeyRef.current === commentKey) return;
    aiCommentKeyRef.current = commentKey;
    setComputeHighlightState('running');
    setAiCommentLoading(true);
    if (forceRefresh) {
      setAiComment(null);
    }

    try {
      const { data } = await apiInterceptor({
        url: `/leaderboard/ai-comment?user=${walletAddress}&type=${leaderboardType}&t=${Date.now()}`,
      });
      if (data.success && data.comment) {
        setAiComment(data.comment);
        setComputeHighlightState('success');
      }
    } catch (_err) {
      // No-op: keep UI stable if compute endpoint is temporarily unavailable.
      setComputeHighlightState('idle');
    } finally {
      setAiCommentLoading(false);
    }
  };

  useEffect(() => {
    if (computeHighlightState !== 'success') return undefined;
    if (computeSuccessTimerRef.current) {
      clearTimeout(computeSuccessTimerRef.current);
    }
    computeSuccessTimerRef.current = setTimeout(() => {
      setComputeHighlightState('idle');
      computeSuccessTimerRef.current = null;
    }, 1800);
    return () => {
      if (computeSuccessTimerRef.current) {
        clearTimeout(computeSuccessTimerRef.current);
        computeSuccessTimerRef.current = null;
      }
    };
  }, [computeHighlightState]);

  // Fetch AI comment when leaderboard data + player data available
  useEffect(() => {
    void fetchAiComment(false);
  }, [walletAddress, leaderboardData, leaderboardType, playerData]);

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
  const topEntry = transformedLeaderboard[0];
  const currentPlayerName = playerData?.userGameData?.playerName || 'You';
  const computeStatusLabel = aiCommentLoading
    ? '0G Compute is generating top-player insight...'
    : aiComment
      ? `Latest insight generated for top racer ${topEntry?.player || 'Unknown'}`
      : 'Open leaderboard to trigger 0G compute insight';

  return (
    <div className="section" style={{minHeight:'75vh'}}>
      <h2 className="section-title">{title}</h2>
      <p className="section-subtitle">{subtitle}</p>
      <div className={`compute-hero-card compute-hero-card-${computeHighlightState}`}>
        <div className="compute-hero-top">
          <div className="compute-flow-head">
            <Zap size={16} />
            <span>0G Compute Live</span>
            <span className="ai-comment-badge">Powered by 0G Compute</span>
            <span className="compute-live-pill">
              <span className="compute-live-dot"></span>
              Live
            </span>
          </div>
          <button
            type="button"
            className={`compute-run-btn compute-run-btn-${computeHighlightState}`}
            onClick={() => void fetchAiComment(true)}
            disabled={aiCommentLoading}
          >
            {aiCommentLoading ? 'Running 0G Compute...' : 'Run 0G Compute Now'}
          </button>
        </div>

        <p className="compute-flow-copy">
          Vehicle Garage opened {'>'} Leaderboard opened {'>'} Top user analyzed {'>'} AI comment visible.
        </p>

        {(aiComment || aiCommentLoading) && (
          <div className="ai-comment-content compute-top-comment">
            <span className="ai-comment-badge">Powered by 0G Compute</span>
            <span className="ai-comment-text">
              {aiCommentLoading ? 'Generating live insight from 0G Compute...' : aiComment}
            </span>
            {computeHighlightState === 'success' && (
              <span className="compute-success-note">Insight generated successfully on 0G Compute</span>
            )}
          </div>
        )}

        <div className={`compute-step-grid compute-step-grid-${computeHighlightState}`}>
          <div className="compute-step"><strong>1</strong><span>Vehicle Garage open</span></div>
          <div className="compute-step"><strong>2</strong><span>Leaderboard open</span></div>
          <div className="compute-step"><strong>3</strong><span>Top racer analyzed</span></div>
          <div className="compute-step"><strong>4</strong><span>AI comment generated</span></div>
        </div>

        <div className="compute-flow-meta">
          <span>Driver: {currentPlayerName}</span>
          <span>Top Racer: {topEntry?.player || 'Unknown'}</span>
          <span>{computeStatusLabel}</span>
        </div>
      </div>
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

const MARKETPLACE_CONTRACT = import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS;
const PURCHASE_ABI = [
  'function purchaseAsset(bytes32 assetHash, string userIdentifier) external payable',
];

// Prefer MetaMask when multiple wallets are injected (avoids Zerion/other interceptors)
function getPreferredEthereumProvider() {
  const providers = window.ethereum?.providers;
  if (Array.isArray(providers) && providers.length > 0) {
    return providers.find(p => p.isMetaMask && !p.isZerion && !p.isCoinbaseWallet)
      || providers.find(p => p.isMetaMask)
      || providers[0];
  }
  return window.ethereum;
}

// Maps marketplace asset IDs to local images already bundled
const LOCAL_IMAGES = {
  ctr: CTRImg,
  f1: F1Img,
  jeep: JeepImg,
  lamborghini: LamborghiniImg,
  muscle: MuscleImg,
  suv: SUVImg,
};

function MarketplaceSection() {
  const { showToast } = useBlockchainToast();
  const { canUsePrivy, activeWallet, sendPrivyTransaction, switchToZeroG, allowedChain } = usePrivyWalletTools();
  const walletAddress = activeWallet?.address || localStorage.getItem('walletAddress');

  const [assets, setAssets] = useState([]);
  const [ownedIds, setOwnedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [list, owned] = await Promise.all([
        fetchMarketplaceAssets(),
        walletAddress ? fetchUserPurchases(walletAddress) : Promise.resolve([]),
      ]);
      setAssets(list.filter(a => a.isActive));
      setOwnedIds(owned);
    } catch (err) {
      console.error('Marketplace load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [walletAddress]);

  const handleBuy = async (asset) => {
    if (!canUsePrivy || !activeWallet?.address) {
      showToast({ title: '🔌 Wallet required', description: 'Connect your wallet to purchase.', duration: 4000 });
      return;
    }
    if (!MARKETPLACE_CONTRACT) {
      showToast({ title: '⚠️ Config error', description: 'Marketplace contract not configured.', duration: 4000 });
      return;
    }
    if (buying) return;
    setBuying(asset.id);
    try {
      // Step 1: Switch to 0G via Privy (works for MetaMask, Coinbase, embedded wallets)
      await switchToZeroG();

      // Step 2: Encode purchaseAsset call — always lowercase so hasPurchased check matches
      const userIdentifier = activeWallet.address.toLowerCase();
      const iface = new ethers.Interface(PURCHASE_ABI);
      const data = iface.encodeFunctionData('purchaseAsset', [asset.hash, userIdentifier]);

      showToast({ title: '⏳ Confirm in wallet', description: `Purchasing ${asset.name} for ${asset.price} OG…`, duration: 8000 });

      // Step 3: Send via Privy — works for MetaMask, Coinbase, embedded wallets through one API
      const receipt = await sendPrivyTransaction(
        {
          to: MARKETPLACE_CONTRACT,
          value: BigInt(asset.priceWei),
          data,
          chainId: allowedChain.decimalChainId,
        },
        {
          address: activeWallet.address,
          uiOptions: { showWalletUIs: true },
        },
      );

      const txHash = typeof receipt === 'string' ? receipt : receipt?.transactionHash || receipt?.hash;

      showToast({ title: '📡 Transaction sent', description: 'Waiting for confirmation…', txHash, duration: 10000 });

      // Verify on backend
      await verifyPurchase({ txHash, assetId: asset.id, userIdentifier });

      setOwnedIds(prev => [...new Set([...prev, asset.id])]);
      showToast({
        title: `🚗 ${asset.name} unlocked!`,
        description: `Purchase confirmed on 0G. Head to the Garage to equip it.`,
        txHash,
        duration: 8000,
      });
    } catch (err) {
      const msg = err?.reason || err?.message || 'Purchase failed';
      showToast({ title: '❌ Purchase failed', description: msg.slice(0, 120), duration: 6000 });
    } finally {
      setBuying(null);
    }
  };

  if (loading) {
    return (
      <div className="section">
        <h2 className="section-title">CAR MARKETPLACE</h2>
        <div className="cars-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={`sk-${idx}`} className="car-box">
              <div className="car-visual" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                <div className="loading-spinner" />
              </div>
              <div style={{ height: '18px', width: '70%', margin: '0.8rem auto', background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }} />
              <div style={{ height: '14px', width: '50%', margin: '0 auto 0.8rem', background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }} />
              <button className="select-btn" disabled>Loading…</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <h2 className="section-title">CAR MARKETPLACE</h2>
      <p className="section-subtitle">
        Vehicles are registered on 0G EVM · Metadata stored on 0G DA
      </p>
      <div className="cars-grid">
        {assets.map((asset, index) => {
          const owned = ownedIds.includes(asset.id);
          const isBuying = buying === asset.id;
          const img = LOCAL_IMAGES[asset.id];
          return (
            <motion.div
              key={asset.id}
              className="car-box"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: owned ? 0 : -8 }}
            >
              <span className={`rarity-tag ${(asset.rarity || 'common').toLowerCase()}`}>
                {asset.rarity || 'Common'}
              </span>
              {owned && (
                <span style={{
                  position: 'absolute', top: '0.5rem', right: '0.5rem',
                  background: 'rgba(0,220,130,0.15)', color: '#00dc82',
                  border: '1px solid rgba(0,220,130,0.35)',
                  borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700,
                  padding: '2px 8px', letterSpacing: '0.05em',
                }}>OWNED</span>
              )}
              <div className="car-visual">
                {img
                  ? <img src={img} alt={asset.name} className="car-image" />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                      <Car size={48} />
                    </div>
                }
              </div>
              <h3>{asset.name}</h3>
              <p style={{ opacity: 0.85, marginBottom: '0.65rem', fontSize: '1rem', fontWeight: 700, color: '#00d4ff' }}>
                {asset.price} OG
              </p>
              {owned ? (
                <button className="select-btn" disabled style={{ background: 'rgba(0,220,130,0.15)', color: '#00dc82', border: '1px solid rgba(0,220,130,0.35)' }}>
                  ✓ Owned
                </button>
              ) : (
                <button
                  className="select-btn"
                  disabled={isBuying || !canUsePrivy}
                  onClick={() => handleBuy(asset)}
                  style={isBuying ? { opacity: 0.6 } : {}}
                >
                  {isBuying ? 'Processing…' : `Buy · ${asset.price} OG`}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
      {assets.length === 0 && (
        <div className="coming-soon">
          <ShoppingCart size={64} />
          <h3>No assets available</h3>
          <p>Check back soon for new vehicles.</p>
        </div>
      )}
      <p style={{ marginTop: '1rem', opacity: 0.4, fontSize: '0.78rem', textAlign: 'center' }}>
        Purchases are on-chain · 0G Mainnet (chainId 16661)
      </p>
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

function formatPlayTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function leaderboardDataSafe(playerData) {
  return Number(
    playerData?.playerGameModeData?.bestScoreOneWay ||
    playerData?.playerGameModeData?.bestScoreTwoWay ||
    playerData?.playerGameModeData?.bestScoreTimeAttack ||
    playerData?.playerGameModeData?.bestScoreBomb ||
    0
  );
}
