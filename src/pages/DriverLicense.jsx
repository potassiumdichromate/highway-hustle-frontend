import React, { useState } from 'react';
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
  Upload
} from 'lucide-react';
import SynthwaveBackground from '../components/SynthwaveBackground';
import { logout as clearAuth } from '../api/auth';
import './DriverLicense.css';

// Mock data
const mockUserData = {
  name: 'Road Warrior',
  level: 42,
  cars: [
    { id: 1, name: 'Neon Phantom', rarity: 'Legendary', image: 'car1.png' },
    { id: 2, name: 'Cyber Cruiser', rarity: 'Epic', image: 'car2.png' },
    { id: 3, name: 'Street Viper', rarity: 'Rare', image: 'car3.png' }
  ],
  stats: {
    totalRaces: 1247,
    wins: 892,
    winRate: 71.5,
    totalMiles: 45678
  },
  missions: [
    { id: 1, title: 'Win 10 One Way races', progress: 7, total: 10, reward: 500 },
    { id: 2, title: 'Drive 1000 miles', progress: 847, total: 1000, reward: 1000 },
    { id: 3, title: 'Complete 5 Timebomb challenges', progress: 3, total: 5, reward: 750 }
  ]
};

const gameModesLeaderboard = {
  oneWay: [
    { rank: 1, player: 'SpeedDemon', score: 99999, address: '0x1234...5678' },
    { rank: 2, player: 'NightRider', score: 95432, address: '0xabcd...efgh' },
    { rank: 3, player: 'TurboKing', score: 91234, address: '0x9876...5432' }
  ],
  twoWay: [
    { rank: 1, player: 'DriftMaster', score: 88888, address: '0x2468...1357' },
    { rank: 2, player: 'RoadRage', score: 85321, address: '0x1357...2468' },
    { rank: 3, player: 'VelocityX', score: 82156, address: '0x8642...9753' }
  ],
  timebomb: [
    { rank: 1, player: 'TimeLord', score: 77777, address: '0x3691...2580' },
    { rank: 2, player: 'BombSquad', score: 74521, address: '0x1593...7530' },
    { rank: 3, player: 'ClockWork', score: 71234, address: '0x7531...9512' }
  ],
  sprint: [
    { rank: 1, player: 'Lightning', score: 66666, address: '0x9517...5318' },
    { rank: 2, player: 'FlashPoint', score: 63421, address: '0x7539...5142' },
    { rank: 3, player: 'RocketMan', score: 60987, address: '0x1593...7531' }
  ]
};

export default function DriverLicense() {
  const { account, disconnectWallet } = useWallet();
  const { logout: privyLogout } = usePrivy();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedGameMode, setSelectedGameMode] = useState('oneWay');
  const [chatMessages] = useState([
    { id: 1, user: 'SpeedDemon', message: 'Anyone up for a race?', time: '2m ago' },
    { id: 2, user: 'NightRider', message: 'GG everyone! 🏆', time: '5m ago' }
  ]);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [garageOpen, setGarageOpen] = useState(false);
  const [gameModeSelectOpen, setGameModeSelectOpen] = useState(false);

  const handleLogout = async () => {
    console.log('[DriverLicense] Logout requested');
    try {
      if (privyLogout) {
        await privyLogout();
      }
    } catch (err) {
      console.warn('[DriverLicense] Privy logout failed', err);
    }
    try {
      disconnectWallet();
    } catch (err) {
      console.warn('[DriverLicense] Wallet disconnect failed', err);
    }
    clearAuth();
    navigate('/');
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
    switch (activeSection) {
      case 'overview':
        return <OverviewSection userData={mockUserData} />;
      case 'garage':
        return <GarageSection cars={mockUserData.cars} />;
      case 'leaderboard':
        return (
          <LeaderboardSection
            selectedGameMode={selectedGameMode}
            setSelectedGameMode={setSelectedGameMode}
            leaderboardData={gameModesLeaderboard}
          />
        );
      case 'marketplace':
        return <MarketplaceSection />;
      case 'missions':
        return <MissionsSection missions={mockUserData.missions} />;
      case 'friends':
        return <FriendsSection />;
      case 'chat':
        return <ChatSection messages={chatMessages} />;
      default:
        return <OverviewSection userData={mockUserData} />;
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
          <div className="wallet-badge">
            <User size={18} />
            <span>{account?.slice(0, 6)}...{account?.slice(-4)}</span>
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
          <GarageModal onClose={() => setGarageOpen(false)} />
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
function GarageModal({ onClose }) {
  const unityBuildUrl = '/unity-builds/garage'; // Update with your actual Unity build path

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
            src={unityBuildUrl}
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
      icon: '🏁',
      description: 'Classic endless highway racing',
      difficulty: 'Easy'
    },
    {
      id: 'twoWay',
      name: 'Two Way',
      icon: '⚡',
      description: 'Dodge oncoming traffic',
      difficulty: 'Medium'
    },
    {
      id: 'speedRun',
      name: 'Speed Run',
      icon: '🚀',
      description: 'Short burst speed challenges',
      difficulty: 'Hard'
    },
    {
      id: 'timeBomb',
      name: 'Time Bomb',
      icon: '💣',
      description: 'Race against the clock',
      difficulty: 'Expert'
    }
  ];

  const handleModeSelect = (modeId) => {
    // Navigate to game page with selected mode
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
              <div className="mode-icon-large">{mode.icon}</div>
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
function OverviewSection({ userData }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(userData.name);
  const [tempName, setTempName] = useState(userData.name);

  const gameModeStats = {
    oneWay: { bestScore: 15420, totalScore: 124567, timePlayed: '12h 34m' },
    twoWay: { bestScore: 13890, totalScore: 98432, timePlayed: '9h 15m' },
    speedRun: { bestScore: 18750, totalScore: 145890, timePlayed: '15h 45m' },
    timeBomb: { bestScore: 12340, totalScore: 87650, timePlayed: '8h 22m' }
  };

  const vehicleStats = {
    selected: 'Neon Phantom',
    engine: 92,
    acceleration: 88,
    brakes: 85,
    torque: 90
  };

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
              />
              <button onClick={() => { setDisplayName(tempName); setIsEditingName(false); }}>✓</button>
              <button onClick={() => { setTempName(displayName); setIsEditingName(false); }}>×</button>
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
          <span className="level-num">{userData.level}</span>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="stats-row">
        <StatBox icon={<Trophy />} label="Races" value={userData.stats.totalRaces} />
        <StatBox icon={<Award />} label="Wins" value={userData.stats.wins} />
        <StatBox icon={<TrendingUp />} label="Win Rate" value={`${userData.stats.winRate}%`} />
        <StatBox icon={<Zap />} label="Miles" value={userData.stats.totalMiles.toLocaleString()} />
      </div>

      {/* Game Mode Stats */}
      <div className="game-modes-section">
        <h3 className="subsection-title">GAME MODE STATISTICS</h3>
        <div className="game-modes-grid">
          <GameModeCard 
            title="One Way" 
            icon="🏁"
            stats={gameModeStats.oneWay}
          />
          <GameModeCard 
            title="Two Way" 
            icon="⚡"
            stats={gameModeStats.twoWay}
          />
          <GameModeCard 
            title="Speed Run" 
            icon="🚀"
            stats={gameModeStats.speedRun}
          />
          <GameModeCard 
            title="Time Bomb" 
            icon="💣"
            stats={gameModeStats.timeBomb}
          />
        </div>
      </div>

      {/* Vehicle Stats */}
      <div className="vehicle-section">
        <h3 className="subsection-title">VEHICLE SELECTED</h3>
        <div className="vehicle-card">
          <div className="vehicle-header">
            <Car size={32} />
            <h4>{vehicleStats.selected}</h4>
          </div>
          <div className="vehicle-stats-grid">
            <VehicleStatBar label="Engine Tuning" value={vehicleStats.engine} />
            <VehicleStatBar label="Acceleration" value={vehicleStats.acceleration} />
            <VehicleStatBar label="Brakes" value={vehicleStats.brakes} />
            <VehicleStatBar label="Torque" value={vehicleStats.torque} />
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="xp-section">
        <div className="xp-header">
          <span>Experience</span>
          <span>6,500 / 10,000 XP</span>
        </div>
        <div className="xp-bar-container">
          <div className="xp-bar" style={{ width: '65%' }}></div>
        </div>
      </div>
    </div>
  );
}

function GameModeCard({ title, icon, stats }) {
  return (
    <motion.div 
      className="game-mode-card"
      whileHover={{ y: -5 }}
    >
      <div className="mode-header">
        <span className="mode-icon">{icon}</span>
        <h4>{title}</h4>
      </div>
      <div className="mode-stats">
        <div className="mode-stat">
          <span className="stat-label">Best Score</span>
          <span className="stat-value">{stats.bestScore.toLocaleString()}</span>
        </div>
        <div className="mode-stat">
          <span className="stat-label">Total Score</span>
          <span className="stat-value">{stats.totalScore.toLocaleString()}</span>
        </div>
        <div className="mode-stat">
          <span className="stat-label">Time Played</span>
          <span className="stat-value">{stats.timePlayed}</span>
        </div>
      </div>
    </motion.div>
  );
}

function VehicleStatBar({ label, value }) {
  return (
    <div className="vehicle-stat">
      <div className="vehicle-stat-label">
        <span>{label}</span>
        <span className="vehicle-stat-value">{value}%</span>
      </div>
      <div className="vehicle-stat-bar-bg">
        <div 
          className="vehicle-stat-bar-fill" 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
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

function GarageSection({ cars }) {
  return (
    <div className="section">
      <h2 className="section-title">MY GARAGE</h2>
      <div className="cars-grid">
        {cars.map((car, index) => (
          <motion.div
            key={car.id}
            className="car-box"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8 }}
          >
            <span className={`rarity-tag ${car.rarity.toLowerCase()}`}>{car.rarity}</span>
            <div className="car-visual">
              <Car size={56} />
            </div>
            <h3>{car.name}</h3>
            <button className="select-btn">SELECT</button>
          </motion.div>
        ))}
        <div className="car-box locked">
          <Lock size={40} />
          <p>Coming Soon</p>
        </div>
      </div>
    </div>
  );
}

function LeaderboardSection({ selectedGameMode, setSelectedGameMode, leaderboardData }) {
  const modes = [
    { key: 'oneWay', label: 'One Way' },
    { key: 'twoWay', label: 'Two Way' },
    { key: 'timebomb', label: 'Timebomb' },
    { key: 'sprint', label: 'Sprint' }
  ];

  return (
    <div className="section">
      <h2 className="section-title">GLOBAL LEADERBOARD</h2>

      <div className="mode-tabs">
        {modes.map((mode) => (
          <button
            key={mode.key}
            className={`mode-tab ${selectedGameMode === mode.key ? 'active' : ''}`}
            onClick={() => setSelectedGameMode(mode.key)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="leaderboard-list">
        {leaderboardData[selectedGameMode].map((entry, index) => (
          <motion.div
            key={entry.rank}
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
            <div className="score">{entry.score.toLocaleString()}</div>
          </motion.div>
        ))}
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

function MissionsSection({ missions }) {
  return (
    <div className="section">
      <h2 className="section-title">ACTIVE MISSIONS</h2>
      <div className="missions-list">
        {missions.map((mission, index) => (
          <motion.div
            key={mission.id}
            className="mission-box"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="mission-head">
              <Target size={20} />
              <h3>{mission.title}</h3>
            </div>
            <div className="mission-prog">
              <div className="prog-bar-bg">
                <div className="prog-bar" style={{ width: `${(mission.progress / mission.total) * 100}%` }}></div>
              </div>
              <span>{mission.progress} / {mission.total}</span>
            </div>
            <div className="mission-reward">
              <Award size={16} />
              <span>{mission.reward} XP</span>
            </div>
          </motion.div>
        ))}
      </div>
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
