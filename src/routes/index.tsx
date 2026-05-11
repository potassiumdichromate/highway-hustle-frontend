import { useEffect, useRef, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { toast } from "sonner";
import { ethers } from "ethers";
import { purchaseVehicle } from "@/lib/contract-utils";

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ShieldCheck, Zap, Link2, ChevronLeft, ChevronRight, Play, ArrowRight, Flag, Trophy, Timer, Wind, Siren, Users, Globe, ShoppingCart, Gauge, Activity, Cpu, X, User, Loader2 } from "lucide-react";
import heroCar from "@/assets/hero-car.jpg";
import logo from "@/assets/logo-flame.png";
import modeQuick from "@/assets/mode-quick.jpg";
import modeTournament from "@/assets/mode-tournament.jpg";
import modeTime from "@/assets/mode-time.jpg";
import modeDrift from "@/assets/mode-drift.jpg";
import modeChase from "@/assets/mode-chase.jpg";
import modeVersus from "@/assets/mode-versus.jpg";
import ogPlatform from "@/assets/og-platform.jpg";
import helmet from "@/assets/helmet.jpg";
import ogLogo from "@/assets/og-logo.png";
import SpeedFX from "@/components/SpeedFX";
import { usePrivyWalletTools } from "../hooks/usePrivyWalletTools";
import cyberCoupe from "../assets/cars/coupe.png";
import hyperDrift from "../assets/cars/f1.png";
import stealthInterceptor from "../assets/cars/ctr.png";
import builtCar from "../assets/cars/built-car.png";
import protoRacer from "../assets/cars/lamborghini.png";
import jeepImg from "../assets/cars/jeep.png";
import suvImg from "../assets/cars/suv.png";
import muscleImg from "../assets/cars/muscle.png";
import pickupImg from "../assets/cars/pickup.png";
import NeuralBackground from "@/components/NeuralBackground";
import CustomLoginModal from "@/components/CustomLoginModal";
import trailerVideo from "@/assets/HH-LIVE.mp4";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Highway Hustle — Race. Drift. Dominate." },
      { name: "description", content: "Adrenaline-pumped arcade racing built for skill. Secured on OG infrastructure." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: Index,
});

const navItems = ["GAME MODES", "LEADERBOARD", "MARKETPLACE"];

const iconMap: Record<string, any> = {
  Flag,
  Trophy,
  Timer,
  Siren,
  Wind,
  Users
};

// Types for the real data
interface GameMode {
  id: string;
  name: string;
  icon: string;
  img: string;
  color: string;
  desc: string[];
  gameUrl: string;
  active?: boolean;
}

const modes: GameMode[] = [
  { 
    id: "one-way",
    name: "ONE WAY", 
    icon: "Flag", 
    img: modeQuick, 
    color: "text-neon-cyan", 
    desc: ["Classic endless highway racing.", "DIFFICULTY: EASY"],
    gameUrl: "https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/OneWay/7/index.html"
  },
  { 
    id: "two-way",
    name: "TWO WAY", 
    icon: "Trophy", 
    img: modeTournament, 
    color: "text-neon-yellow", 
    desc: ["Dodge oncoming traffic.", "DIFFICULTY: MEDIUM"],
    gameUrl: "https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/TwoWay/4/index.html"
  },
  { 
    id: "speed-run",
    name: "SPEED RUN", 
    icon: "Timer", 
    img: modeTime, 
    color: "text-neon-green", 
    desc: ["Short burst speed challenges.", "DIFFICULTY: HARD"],
    gameUrl: "https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/SpeedRun/3/index.html"
  },
  { 
    id: "time-bomb",
    name: "TIME BOMB", 
    icon: "Siren", 
    img: modeChase, 
    color: "text-destructive", 
    desc: ["Race against the clock.", "DIFFICULTY: EXPERT"],
    gameUrl: "https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/TimeBomb/3/index.html"
  },
];

interface LeaderboardPlayer {
  _id: string;
  privyData?: {
    walletAddress?: string;
  };
  userGameData?: {
    playerName?: string;
    currency?: number;
  };
  playerGameModeData?: {
    bestScoreOneWay?: number;
  };
  playerVehicleData?: {
    selectedPlayerCarIndex?: number;
  };
}

const INDEX_TO_CAR_NAME: Record<number, string> = {
  0: "Cyber Coupe",
  5: "Pickup Truck",
  6: "Hyper Drift SUV",
  8: "Stealth Jeep",
  10: "Proto Racer",
  11: "CTR Interceptor",
  12: "Muscle Monster",
  13: "F1 Phantom"
};

interface MarketplaceItem {
  id: string;
  name: string;
  img: any;
  price: string;
  priceOG: string;
  hash: string;
  stats: {
    speed: number;
    accel: number;
    handl: number;
  };
  color: string;
}

function OgBadge({ small }: { small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-neon-blue/40 bg-background/60 px-2 py-1 sm:px-3 ${small ? "text-[10px]" : "text-xs"} font-display tracking-widest`}>
      <span className="hidden sm:inline text-muted-foreground">POWERED BY</span>
      <img src={ogLogo} alt="0G" className={`${small ? "h-4 sm:h-5" : "h-5 sm:h-7"} w-auto animate-neon-pulse`} />
    </span>
  );
}

function Reveal({ children, className = "", animation = "reveal-up" }: { children: React.ReactNode, className?: string, animation?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05, rootMargin: "0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${className} reveal-on-scroll ${animation} ${isVisible ? "is-visible" : ""}`}>
      {children}
    </div>
  );
}

function Index() {
  const { login, authenticated, logout, user } = usePrivy();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [isMarketplaceLoading, setIsMarketplaceLoading] = useState(true);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  
  const { wallets } = useWallets();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);

  // ✅ DIAGNOSTIC: Log on every render to track auth state

  // Fetch real leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLeaderboardLoading(true);
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4500/api";
        const response = await fetch(`${baseUrl}/leaderboard?t=${Date.now()}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard.slice(0, 5));
        }
      } catch (error) {
        console.error("❌ Error fetching leaderboard:", error);
      } finally {
        setIsLeaderboardLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  // Fetch marketplace assets only when authenticated
  useEffect(() => {
    const fetchMarketplace = async () => {
      const token = localStorage.getItem("hh_auth_token");
      if (!authenticated || !token) {
        setIsMarketplaceLoading(false);
        return;
      }

      try {
        setIsMarketplaceLoading(true);
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4500/api";
        
        const response = await fetch(`${baseUrl}/marketplace/assets?pageSize=4`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success && Array.isArray(data.assets)) {
          const imgMap: Record<string, any> = {
            "ctr": stealthInterceptor,
            "f1": hyperDrift,
            "jeep": jeepImg,
            "van": builtCar,
            "lamborghini": protoRacer,
            "coupe": cyberCoupe,
            "suv": suvImg,
            "muscle": muscleImg,
            "pickup": pickupImg
          };
          const colorMap: Record<string, string> = {
            "ctr": "text-neon-pink",
            "f1": "text-neon-yellow",
            "jeep": "text-neon-cyan",
            "van": "text-neon-green",
            "lamborghini": "text-primary"
          };
          const statsMap: Record<string, any> = {
            "ctr": { speed: 85, accel: 90, handl: 78 },
            "f1": { speed: 82, accel: 85, handl: 95 },
            "jeep": { speed: 60, accel: 55, handl: 50 },
            "van": { speed: 50, accel: 45, handl: 40 },
            "lamborghini": { speed: 98, accel: 98, handl: 92 }
          };

          const mappedItems = data.assets.slice(0, 4).map((a: any) => ({
            id: a.id,
            name: a.name.toUpperCase(),
            img: imgMap[a.id] || cyberCoupe,
            price: `${a.price} OG`,
            priceOG: a.price,
            hash: a.hash,
            stats: statsMap[a.id] || { speed: 70, accel: 70, handl: 70 },
            color: colorMap[a.id] || "text-white"
          }));
          setMarketplaceItems(mappedItems);
        }
      } catch (error) {
        console.error("❌ Error fetching marketplace:", error);
      } finally {
        setIsMarketplaceLoading(false);
      }
    };

    fetchMarketplace();
  }, [authenticated]);

  const { activeWallet, sendPrivyTransaction, switchToZeroG, canUsePrivy, allowedChain } = usePrivyWalletTools();

  const handleAcquire = async (asset: MarketplaceItem) => {
    if (!authenticated) {
      setShowLoginModal(true);
      return;
    }
    
    if (purchasingId) return;

    if (!canUsePrivy || !activeWallet?.address) {
      toast.error("Wallet required. Please connect your wallet to purchase.");
      login();
      return;
    }

    const marketplaceContract = import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS;
    if (!marketplaceContract) {
      toast.error("Marketplace contract not configured.");
      return;
    }

    if (purchasingId) return;
    setPurchasingId(asset.id);

    try {
      await switchToZeroG();

      const userIdentifier = activeWallet.address.toLowerCase();
      const PURCHASE_ABI = ['function purchaseAsset(bytes32 assetHash, string userIdentifier) external payable'];
      const iface = new ethers.Interface(PURCHASE_ABI);
      const data = iface.encodeFunctionData('purchaseAsset', [asset.hash, userIdentifier]);

      toast.info(`Purchasing ${asset.name} for ${asset.price}...`);

      const priceInWei = ethers.parseEther(asset.priceOG.replace(/[^0-9.]/g, ''));
      
      const receipt = await sendPrivyTransaction(
        {
          to: marketplaceContract,
          value: BigInt(priceInWei.toString()),
          data,
          chainId: allowedChain.decimalChainId,
        },
        {
          address: activeWallet.address,
          uiOptions: { showWalletUIs: true },
        },
      );

      const txHash = typeof receipt === 'string' ? receipt : (receipt as any)?.transactionHash || (receipt as any)?.hash;
      toast.success("Transaction sent! Confirming...");

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4500/api";
      const verifyResponse = await fetch(`${baseUrl}/marketplace/purchase/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash,
          assetId: asset.id,
          userIdentifier
        })
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        toast.success(`${asset.name} unlocked!`);
        navigate({ to: "/profile" });
      } else {
        toast.warning("Verification is pending. Your garage will update shortly.");
      }
    } catch (error: any) {
      console.error("❌ Purchase failed:", error);
      toast.error(error.message || "Purchase failed.");
    } finally {
      setPurchasingId(null);
    }
  };

  // Sync authentication with backend
  useEffect(() => {
    
    if (authenticated && user) {
      const recordLogin = async () => {
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4500/api";
          
          // Improved identifier resolution
          const walletAddr = user.wallet?.address || user.linkedAccounts?.find(a => a.type === 'wallet')?.address;
          const emailAddr = user.email?.address || user.linkedAccounts?.find(a => a.type === 'email')?.address;
          
          const rawIdentifier = walletAddr || emailAddr;
          
          if (!rawIdentifier) {
            return;
          }
          
          const identifier = String(rawIdentifier).toLowerCase();

          // 1. Force a login sync to ensure the record exists and get a fresh JWT token
          const loginResponse = await fetch(`${baseUrl}/player/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              walletAddress: identifier,
              email: emailAddr?.toLowerCase(),
              privyMetaData: {
                id: user.id,
                type: walletAddr ? "wallet" : "email"
              }
            })
          });
          
          const loginResult = await loginResponse.json();
          
          if (loginResult.success && loginResult.data.token) {
            localStorage.setItem("hh_auth_token", loginResult.data.token);
          }

        } catch (err) {
          console.error("❌ Error recording login:", err);
        }
      };
      recordLogin();
    }
  }, [authenticated, user, user?.wallet?.address]);

  const handleModeClick = (mode: GameMode) => {
    if (!authenticated) {
      setShowLoginModal(true);
      return;
    }

    const walletAddress = user?.wallet?.address;
    if (!walletAddress) {
      setShowLoginModal(true);
      return;
    }

    if (mode.gameUrl) {
      window.location.href = `${mode.gameUrl}?wallet=${walletAddress}`;
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);

      // Scroll Spy logic
      const sections = ["game-modes", "leaderboard", "marketplace"];
      let currentSection = "";
      
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            currentSection = sectionId;
            break;
          }
        }
      }

      if (window.scrollY < 100) {
        if (window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      } else if (currentSection && window.location.hash !== `#${currentSection}`) {
        window.history.replaceState(null, "", `#${currentSection}`);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-[#050510] relative">
      {/* 3D Global Background */}
      <NeuralBackground />

      <div className="relative z-10">
        {/* Progress Bar */}
        <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background py-4 shadow-lg shadow-black/20">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Highway Hustle" className="h-10 w-10" />
            <div className="font-display leading-none">
              <div className="text-sm font-black tracking-wider text-gradient-chrome">HIGHWAY</div>
              <div className="text-lg font-black tracking-wider bg-gradient-to-r from-neon-pink to-primary bg-clip-text text-transparent">HUSTLE</div>
            </div>
          </div>
          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((n) => (
              <a key={n} href={`#${n.toLowerCase().replace(" ", "-")}`} className="font-display text-[10px] font-bold tracking-widest text-foreground/70 transition hover:text-neon-pink">{n}</a>
            ))}
          </nav>
          <div className="flex items-center gap-6">
            <OgBadge small />
            {authenticated ? (
              <Link to="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 transition hover:bg-neon-pink/20 hover:border-neon-pink/50 hover:text-neon-pink hover:shadow-neon-pink">
                <User className="h-5 w-5" />
              </Link>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="rounded-md bg-gradient-primary px-5 py-2 font-display text-[10px] font-bold tracking-widest shadow-neon-pink transition hover:scale-105"
              >
                LOGIN
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[90vh] pt-32 flex flex-col justify-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img src={heroCar} alt="" className="h-full w-full object-cover opacity-90 animate-car-cruise" width={1920} height={1280} />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          <SpeedFX />
          {/* Animated road dashes */}
          <div className="pointer-events-none absolute bottom-10 left-0 right-0 h-1 opacity-70 road-dash" />
          <div className="pointer-events-none absolute bottom-20 left-0 right-0 h-[2px] opacity-40 road-dash" style={{ animationDuration: "0.9s" }} />
        </div>

        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-6 pt-8 pb-16 lg:grid-cols-2">
          <div className="relative z-10">
            <h1 className="font-display text-6xl font-black leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
              <span className="block text-gradient-chrome">RACE.</span>
              <span className="block text-gradient-chrome">DRIFT.</span>
              <span className="block bg-gradient-to-r from-neon-pink via-primary to-accent bg-clip-text text-transparent neon-glow-pink">DOMINATE.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-foreground/80">
              Adrenaline-pumped arcade racing built for skill. Secured on{" "}
              <img src={ogLogo} alt="0G" className="inline h-7 w-auto align-middle animate-neon-pulse" /> infrastructure.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-6 max-w-lg">
              {[
                { icon: ShieldCheck, title: "FAIR & VERIFIED", desc: "Every race result secured on OG.", color: "text-neon-pink" },
                { icon: Zap, title: "ULTRA LOW LATENCY", desc: "Real-time racing with zero lag.", color: "text-neon-blue" },
                { icon: Link2, title: "PLAYER OWNED", desc: "Your progress. Your identity.", color: "text-primary" },
              ].map((f) => (
                <div key={f.title}>
                  <f.icon className={`mb-2 h-6 w-6 ${f.color}`} />
                  <div className="font-display text-xs font-bold tracking-wider">{f.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground leading-tight">{f.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button 
                onClick={() => authenticated ? setIsModeModalOpen(true) : setShowLoginModal(true)}
                className="btn-neon group flex items-center gap-3 rounded-md bg-gradient-primary px-7 py-4 font-display text-sm font-bold tracking-widest shadow-neon-pink transition"
              >
                {authenticated ? "PLAY NOW" : "START YOUR JOURNEY"}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/30 transition-transform group-hover:translate-x-1">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
              <button 
                onClick={() => setShowTrailer(true)}
                className="btn-cyber animate-cyber-pulse flex items-center gap-3 rounded-md border border-neon-blue/40 bg-background/40 px-7 py-4 font-display text-sm font-bold tracking-widest backdrop-blur transition hover:border-neon-blue hover:bg-neon-blue/10"
              >
                WATCH TRAILER
                <Play className="h-4 w-4 fill-current" />
              </button>
            </div>
          </div>

          {/* Center logo + neon sign */}
          <div className="relative hidden lg:block">
            <div className="flex flex-col items-center justify-center pt-8">
              <img src={logo} alt="" className="h-32 w-32 drop-shadow-[0_0_30px_oklch(0.7_0.25_250/0.7)]" />
              <div className="mt-2 font-display text-5xl font-black text-gradient-chrome">HIGHWAY</div>
              <div className="font-display text-5xl font-black text-gradient-chrome">HUSTLE</div>
              <div className="mt-3"><OgBadge /></div>
            </div>
            <div className="absolute right-0 top-0 rotate-6 rounded-md border-2 border-neon-pink bg-background/30 px-5 py-3 shadow-neon-pink">
              <div className="font-display text-sm font-bold tracking-wider text-neon-pink neon-glow-pink">NO LIMITS.</div>
              <div className="font-display text-sm font-bold tracking-wider text-neon-pink neon-glow-pink">JUST YOU.</div>
              <div className="font-display text-sm font-bold tracking-wider text-neon-pink neon-glow-pink">THE ROAD.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Modes */}
      <Reveal animation="reveal-left">
        <section id="game-modes" className="relative mx-auto max-w-[1400px] px-6 py-10">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="h-1 w-1 rounded-full bg-neon-pink" />
          <h2 className="font-display text-2xl font-black tracking-[0.3em] text-gradient-chrome">MULTI GAME MODES</h2>
          <span className="h-1 w-1 rounded-full bg-neon-pink" />
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 gap-5 px-4 sm:grid-cols-2 lg:grid-cols-4 min-h-[240px] relative max-w-5xl mx-auto">
            {modes.length > 0 ? (
              modes.map((m) => {
                const Icon = iconMap[m.icon] || Flag;
                return (
                  <div
                    key={m.id || m.name}
                    onClick={() => handleModeClick(m)}
                    className={`group relative cursor-pointer overflow-hidden rounded-xl border transition hover:scale-[1.03] ${m.active ? "border-neon-green shadow-[0_0_25px_oklch(0.85_0.25_145/0.4)]" : "border-border hover:border-primary"}`}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img src={m.img} alt={m.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                      <Icon className={`absolute left-1/2 top-5 h-8 w-8 -translate-x-1/2 ${m.color} drop-shadow-[0_0_10px_currentColor]`} />
                    </div>
                    <div className="p-2.5 text-center">
                      <div className={`font-display text-[11px] font-black tracking-wider ${m.color}`}>{m.name}</div>
                      {m.desc.map((d) => (
                        <div key={d} className="text-xs text-muted-foreground">{d}</div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-display text-xs tracking-widest uppercase">
                NO MODES AVAILABLE
              </div>
            )}
          </div>
        </div>
      </section>
    </Reveal>

      {/* Global Leaderboard */}
      <Reveal animation="reveal-up">
        <section id="leaderboard" className="relative mx-auto max-w-[1400px] px-6 py-16">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-neon-cyan" />
            <h2 className="font-display text-3xl font-black tracking-[0.2em] text-gradient-chrome uppercase">Global Leaderboard</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground font-sans tracking-wide">SECURED BY 0G DATA AVAILABILITY FOR TRUE FAIRNESS</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card/30 backdrop-blur-xl shadow-2xl">
          <div className="grid grid-cols-3 md:grid-cols-4 border-b border-border bg-background/40 px-6 md:px-8 py-4 font-display text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
            <div>RANK</div>
            <div>PLAYER</div>
            <div className="hidden md:block">WALLET</div>
            <div className="text-right">SCORE</div>
          </div>
          <div className="divide-y divide-border/30 min-h-[400px] relative">
            {isLeaderboardLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : leaderboard.length > 0 ? (
              leaderboard.map((player, index) => (
                <div key={player._id} className="grid grid-cols-3 md:grid-cols-4 items-center px-6 md:px-8 py-5 transition hover:bg-white/[0.02] group">
                  <div className={`font-display text-base md:text-lg font-black ${index === 0 ? "text-yellow-400" : index === 1 ? "text-neon-cyan" : index === 2 ? "text-neon-pink" : "text-muted-foreground/40"}`}>
                    #{index + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/10 font-display text-[8px] font-bold text-muted-foreground">
                      {player.userGameData?.playerName?.slice(0, 2).toUpperCase() || "HH"}
                    </div>
                    <span className="font-display text-xs md:text-sm font-bold tracking-wider text-foreground group-hover:text-primary transition uppercase truncate max-w-[100px] md:max-w-none">
                      {player.userGameData?.playerName || "Unknown"}
                    </span>
                  </div>
                  <div className="hidden md:block font-mono text-[10px] text-muted-foreground/60 tracking-wider">
                    {player.privyData?.walletAddress ? `${player.privyData.walletAddress.slice(0, 6)}...${player.privyData.walletAddress.slice(-4)}` : "N/A"}
                  </div>
                  <div className="text-right font-display text-base md:text-lg font-black text-foreground group-hover:text-neon-pink transition">
                    {(player.userGameData?.currency || 0).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-display text-xs tracking-widest uppercase">
                NO DATA AVAILABLE
              </div>
            )}
          </div>
          <div className="border-t border-border bg-background/20 px-8 py-4 text-center">
             <Link 
              to="/leaderboard" 
              className="font-display text-[10px] font-bold tracking-[0.3em] text-muted-foreground hover:text-neon-pink transition uppercase"
             >
               VIEW FULL RANKINGS →
             </Link>
          </div>
        </div>
      </section>
    </Reveal>

      {/* Car Marketplace */}
      <Reveal animation="reveal-scale">
        <section id="marketplace" className="relative overflow-hidden bg-background/40 py-20 z-10">
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-neon-cyan/10 blur-[120px]" />
        
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-6 w-6 text-neon-pink" />
                <h2 className="font-display text-4xl font-black tracking-tight text-gradient-chrome uppercase">CAR MARKETPLACE</h2>
              </div>
              <p className="mt-2 text-muted-foreground uppercase tracking-[0.2em] text-xs">EXOTIC PERFORMANCE. VERIFIED OWNERSHIP.</p>
            </div>
            {authenticated ? (
              <Link 
                to="/marketplace"
                className="group flex items-center gap-2 font-display text-xs font-bold tracking-widest text-foreground hover:text-neon-pink transition"
              >
                BROWSE ALL <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </Link>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="group flex items-center gap-2 font-display text-xs font-bold tracking-widest text-muted-foreground hover:text-neon-pink transition cursor-pointer"
              >
                BROWSE ALL <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 min-h-[400px] relative">
            {isMarketplaceLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : marketplaceItems.length > 0 ? (
              marketplaceItems.slice(0, 4).map((car) => (
                <div key={car.id} className="group relative rounded-2xl border border-border bg-card/40 p-2 transition hover:border-primary/50 hover:shadow-[0_0_40px_rgba(var(--primary),0.1)]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <img src={car.img} alt={car.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute bottom-3 left-3 rounded-md bg-background/80 px-2 py-1 backdrop-blur-md">
                      <span className={`font-display text-xs font-bold ${car.color}`}>{car.price}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3">
                    <h3 className="font-display text-lg font-black tracking-tight text-foreground group-hover:text-primary transition uppercase">{car.name}</h3>
                    
                    <div className="mt-4 space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold tracking-widest text-muted-foreground">
                          <span>SPEED</span>
                          <span className="text-foreground">{car.stats.speed}%</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <div className="h-full bg-neon-pink transition-all duration-1000" style={{ width: `${car.stats.speed}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold tracking-widest text-muted-foreground">
                          <span>ACCEL</span>
                          <span className="text-foreground">{car.stats.accel}%</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <div className="h-full bg-neon-cyan transition-all duration-1000" style={{ width: `${car.stats.accel}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold tracking-widest text-muted-foreground">
                          <span>HANDLING</span>
                          <span className="text-foreground">{car.stats.handl}%</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <div className="h-full bg-neon-green transition-all duration-1000" style={{ width: `${car.stats.handl}%` }} />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleAcquire(car)}
                      disabled={purchasingId === car.id}
                      className="btn-neon mt-6 w-full rounded-lg border border-primary/30 bg-primary/10 py-3 font-display text-[10px] font-bold tracking-[0.2em] text-primary transition uppercase flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {purchasingId === car.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          PROCESSING...
                        </>
                      ) : (
                        "Purchase Asset"
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-muted-foreground font-display text-xs tracking-widest uppercase">
                No vehicles available in the marketplace
              </div>
            )}
          </div>
        </div>
      </section>
    </Reveal>

      {/* Bottom info row */}
      <Reveal animation="reveal-up">
        <section className="mx-auto max-w-[1400px] px-6 pb-12">
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur md:grid-cols-4">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-display text-lg font-black tracking-wider text-neon-pink neon-glow-pink">BUILT FOR RACERS</h3>
              <p className="mt-1 text-xs text-muted-foreground">High-speed gameplay, skill-based racing, and true ownership.</p>
              <p className="mt-2 font-display text-sm font-bold italic text-neon-blue neon-glow-blue">THIS IS YOUR <span className="text-neon-pink neon-glow-pink">HIGHWAY.</span></p>
            </div>
            <img src={builtCar} alt="" loading="lazy" className="h-20 w-28 rounded-md object-cover" />
          </div>

          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-display text-base font-black tracking-wider inline-flex items-center gap-2">POWERED BY <img src={ogLogo} alt="0G" className="h-8 w-auto animate-neon-pulse" /></h3>
              <p className="mt-1 text-xs text-muted-foreground">Decentralized. Fast. Reliable.<br />Built on the future of data availability.</p>
            </div>
            <img src={ogPlatform} alt="" loading="lazy" className="h-20 w-20 rounded-md object-cover" />
          </div>

          <div>
            <h3 className="font-display text-base font-black tracking-wider text-neon-cyan">JOIN THE COMMUNITY</h3>
            <p className="mt-1 text-xs text-muted-foreground">Be part of the fastest racing community.</p>
            <div className="mt-3 flex gap-3">
              <a href="https://t.me/KultGamesOfficial" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/60 text-muted-foreground transition hover:border-neon-pink hover:text-neon-pink hover:shadow-neon-pink">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M11.944 0C5.356 0 0 5.356 0 11.944c0 6.588 5.356 11.944 11.944 11.944 6.588 0 11.944-5.356 11.944-11.944C23.888 5.356 18.532 0 11.944 0zm5.666 8.28c-.183 1.92-.98 6.61-1.385 8.783-.172.918-.51 1.226-.838 1.256-.713.065-1.254-.473-1.944-.925-1.08-.707-1.69-1.147-2.74-1.838-1.213-.797-.426-1.237.265-1.954.18-.187 3.32-3.045 3.38-3.3.007-.033.013-.156-.06-.22-.074-.065-.183-.042-.26-.025-.11.024-1.86 1.18-5.247 3.465-.497.34-.947.507-1.35.497-.444-.01-.1.3-2.12-.358-.82-.267-1.472-.408-1.413-.863.03-.237.356-.48.977-.73 3.82-1.664 6.366-2.76 7.637-3.288 3.634-1.507 4.39-1.77 4.88-1.78.108-.002.35.025.507.153.133.107.17.25.187.357.017.107.02.312.01.523z"/></svg>
              </a>
              <a href="https://discord.com/invite/Cge7rrCyUB" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/60 text-muted-foreground transition hover:border-neon-pink hover:text-neon-pink hover:shadow-neon-pink">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/></svg>
              </a>
              <a href="https://x.com/_KultGames" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/60 text-muted-foreground transition hover:border-neon-pink hover:text-neon-pink hover:shadow-neon-pink">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
              </a>
            </div>
          </div>

          <div className="relative flex items-center gap-3 rounded-xl border border-neon-pink/60 bg-background/60 p-4 shadow-neon-pink">
            <div>
              <h3 className="font-display text-base font-black tracking-wider text-neon-pink neon-glow-pink">READY TO RACE?</h3>
              <p className="mt-1 text-xs text-muted-foreground">Log in and hit the highway.</p>
            </div>
            <img src={helmet} alt="" loading="lazy" className="h-20 w-20 rounded-md object-cover" />
          </div>
        </div>
      </section>
    </Reveal>

    {/* Game Mode Modal */}
    {isModeModalOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a1a] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neon-pink/10 ring-1 ring-neon-pink/30">
                <Play className="h-6 w-6 fill-neon-pink text-neon-pink" />
              </div>
              <h2 className="font-display text-3xl font-black tracking-[0.2em] text-gradient-chrome">SELECT GAME MODE</h2>
            </div>
            <button 
              onClick={() => setIsModeModalOpen(false)}
              className="rounded-full bg-white/5 p-2 transition hover:bg-neon-pink/20 hover:text-neon-pink"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2">
            {modes.map((m) => {
              const difficulty = m.desc[1]?.split(": ")[1] || "EASY";
              const diffColor = difficulty === "EASY" ? "text-green-400 border-green-500/30 bg-green-500/10" : 
                               difficulty === "MEDIUM" ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" : 
                               difficulty === "HARD" ? "text-orange-400 border-orange-500/30 bg-orange-500/10" : 
                               "text-red-400 border-red-500/30 bg-red-500/10";
              
              const Icon = iconMap[m.icon] || Flag;

              return (
                <div 
                  key={m.id}
                  onClick={() => {
                    handleModeClick(m);
                    setIsModeModalOpen(false);
                  }}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-background p-10 transition hover:border-neon-pink/50 hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]"
                >
                  {/* Background image */}
                  <div className="absolute inset-0 z-0">
                    <img src={m.img} alt="" className="h-full w-full object-cover opacity-30 transition duration-500 group-hover:scale-110 group-hover:opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/80 to-transparent" />
                  </div>

                  {/* Background decoration icon */}
                  <div className="absolute -right-4 -top-4 z-0 opacity-10 transition group-hover:opacity-20">
                    <Icon className="h-32 w-32 rotate-12" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="font-display text-4xl font-black tracking-widest text-white transition group-hover:text-neon-pink group-hover:scale-105">
                      {m.name}
                    </div>
                    <div className="mt-2 text-sm font-medium text-muted-foreground opacity-80">
                      {m.desc[0]}
                    </div>
                    <div className={`mt-8 rounded-md border px-8 py-1.5 text-[10px] font-black tracking-[0.3em] ${diffColor}`}>
                      {difficulty}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Subtle footer */}
          <div className="border-t border-white/5 bg-white/[0.01] px-8 py-4 text-center">
            <p className="text-[10px] font-bold tracking-[0.4em] text-muted-foreground">PREPARE FOR THE ULTIMATE HUSTLE</p>
          </div>
        </div>
      </div>
    )}

      {/* Trailer Video Modal */}
      {showTrailer && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setShowTrailer(false)}
          />
          {/* Video Container */}
          <div className="relative z-10 w-full max-w-4xl mx-4 rounded-2xl overflow-hidden border border-neon-pink/30 shadow-[0_0_60px_rgba(255,0,255,0.2)]">
            {/* Striped top bar */}
            <div className="h-1.5 w-full bg-[repeating-linear-gradient(45deg,#ff00ff,#ff00ff_10px,#00ffff_10px,#00ffff_20px)]" />
            <video
              src={trailerVideo}
              autoPlay
              controls
              className="w-full aspect-video bg-black"
              onEnded={() => setShowTrailer(false)}
            />
          </div>
          {/* Close Button */}
          <button
            onClick={() => setShowTrailer(false)}
            className="absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 border border-white/20 text-white backdrop-blur transition hover:border-neon-pink hover:text-neon-pink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Game Mode Modal */}
      <GameModeModal 
        isOpen={isModeModalOpen} 
        onClose={() => setIsModeModalOpen(false)} 
      />

      {/* Custom Login Modal */}
      <CustomLoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      </div>
    </div>
  );
}

// Mobile-optimized cinematic game mode modal
function GameModeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const { user } = usePrivy();
  const walletAddress = user?.wallet?.address;

  const handleModeClick = (url: string) => {
    if (walletAddress && url) {
      window.location.href = `${url}?wallet=${walletAddress}`;
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      />
      
      {/* Container */}
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-background/40 shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Animated striped header */}
        <div className="h-1.5 w-full bg-[repeating-linear-gradient(45deg,#ff00ff,#ff00ff_10px,#00ffff_10px,#00ffff_20px)] opacity-80 shrink-0" />
        
        <div className="flex flex-1 flex-col overflow-hidden p-6 md:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-display text-3xl font-black tracking-tight text-gradient-chrome uppercase">SELECT MISSION</h2>
              <p className="mt-1 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">CHOOSE YOUR PATH. DOMINATE THE ROAD.</p>
            </div>
            <button 
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 transition hover:bg-neon-pink/20 hover:border-neon-pink/50 hover:text-neon-pink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Content Area - Fixed with flex-1 and min-h-0 to force scroll */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pb-4">
              {modes.map((m) => {
                const Icon = iconMap[m.icon] || Flag;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleModeClick(m.gameUrl)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-card/40 transition hover:scale-[1.02] hover:border-primary/50"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img src={m.img} alt={m.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-background/80 p-3 backdrop-blur-md">
                        <Icon className={`h-6 w-6 ${m.color} drop-shadow-[0_0_8px_currentColor]`} />
                      </div>
                    </div>
                    <div className="p-4 text-center">
                      <div className={`font-display text-sm font-black tracking-wider ${m.color} uppercase`}>{m.name}</div>
                      {m.desc.map((d) => (
                        <div key={d} className="mt-1 text-[10px] font-bold text-muted-foreground uppercase opacity-70">{d}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-8 border-t border-white/5 pt-6 text-center">
            <p className="text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase animate-pulse">PREPARE FOR ADRENALINE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
