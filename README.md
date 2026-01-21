# Highway Hustle 🏁⚡

**Every Mile Matters**

A blockchain-powered racing game with an immersive synthwave-themed dashboard. Built by FrameX Corporation.

## 🎮 Features

### Login System
- **MetaMask Integration**: Seamless Web3 wallet connection
- **Animated Landing Page**: Synthwave 3D background with retro grid effects
- **Responsive Design**: Works perfectly on desktop and mobile

### Driver's License (Dashboard)
- **Profile Overview**: Track your stats, level, and achievements
- **My Garage**: View and manage your car collection with rarity tiers
- **Global Leaderboard**: Compete across 4 game modes:
  - One Way
  - Two Way
  - Timebomb
  - Sprint
- **Car Marketplace**: Buy, sell, and trade vehicles (Coming Soon)
- **Missions System**: Complete challenges to earn XP
- **Friends**: Connect with other drivers (Coming Soon)
- **Global Chat**: Real-time communication with the community
- **AI Assistant**: Get help with strategies and tips

### Design Philosophy
- **Synthwave Aesthetic**: Purple/blue neon color scheme
- **3D Effects**: Three.js powered backgrounds with floating particles
- **Smooth Animations**: Framer Motion for fluid transitions
- **Glass Morphism**: Modern UI with backdrop blur effects
- **Custom Fonts**: Orbitron + Rajdhani for that cyber feel

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MetaMask browser extension
- npm or yarn

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Run Development Server**
```bash
npm run dev
```

3. **Build for Production**
```bash
npm run build
```

4. **Preview Production Build**
```bash
npm run preview
```

## 📁 Project Structure

```
highway-hustle/
├── src/
│   ├── components/
│   │   ├── SynthwaveBackground.jsx  # 3D background with Three.js
│   │   └── ProtectedRoute.jsx       # Auth route wrapper
│   ├── context/
│   │   └── WalletContext.jsx        # MetaMask wallet state
│   ├── pages/
│   │   ├── Login.jsx                # Landing/login page
│   │   ├── Login.css
│   │   ├── DriverLicense.jsx        # Main dashboard
│   │   └── DriverLicense.css
│   ├── App.jsx                      # Main app with routing
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## 🎨 Design System

### Color Palette
```css
--neon-pink: #ff006e
--neon-blue: #06ffa5
--electric-purple: #7209b7
--deep-purple: #3a0ca3
--cyber-blue: #4361ee
--dark-bg: #0a0118
```

### Typography
- **Display**: Orbitron (900 weight for titles)
- **Body**: Rajdhani (300-700 weights)

### Key Components
- Glass Cards: `backdrop-filter: blur(10px)`
- Neon Glow: Multiple box-shadow layers
- Scan Line Effect: Animated gradient overlay
- Grain Texture: SVG noise overlay

## 🔗 Integration Points

### Current (Phase 1)
- ✅ MetaMask wallet connection
- ✅ Responsive UI/UX
- ✅ Dashboard navigation
- ✅ Mock data for all sections

### Future (Phase 2)
- 🔄 Unity WebGL game integration
- 🔄 Backend API connections
- 🔄 Real-time leaderboard updates
- 🔄 NFT marketplace functionality
- 🔄 AI chatbot implementation
- 🔄 Friends system
- 🔄 Live global chat

## 🛠️ Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **3D Graphics**: Three.js + React Three Fiber
- **Animations**: Framer Motion
- **Web3**: Ethers.js v6
- **Routing**: React Router v6
- **Styling**: Custom CSS with CSS Variables
- **Icons**: Lucide React

## 🎯 Next Steps

1. **Replace Mock Data**: Connect to your backend API
2. **Add Unity Game**: Integrate WebGL build
3. **Implement Blockchain**: Deploy smart contracts
4. **Enable Marketplace**: Add NFT trading functionality
5. **AI Integration**: Connect chatbot to AI service
6. **Real-time Features**: Implement WebSocket for chat/leaderboard

## 🎮 Game Modes

### One Way
Classic endless highway racing

### Two Way
Dodge oncoming traffic

### Timebomb
Race against the clock

### Sprint
Short burst speed challenges

## 🏆 Achievements System

- Track races, wins, and total miles
- Level progression with XP rewards
- Mission-based challenges
- Rarity-based car collection

## 📱 Responsive Design

- **Desktop**: Full dashboard experience with sidebar
- **Tablet**: Optimized grid layouts
- **Mobile**: Stack navigation, touch-friendly controls

## 🔒 Security

- MetaMask secure authentication
- Protected routes for authenticated users
- No private keys stored
- Client-side wallet interaction only

## 🤝 Contributing

Built by **FrameX Corporation** - Every Frame Matters

For updates and support:
- Website: highwayhustle.xyz
- Built on: Blockchain Technology

## 📄 License

© 2025 FrameX Corporation. All rights reserved.

---

**Ready to Race?** 🏁

Connect your wallet and hit the highway!
