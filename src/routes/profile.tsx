import { useEffect, useState, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { 
  User, LogOut, ArrowLeft, Shield, Wallet, 
  Trophy, Gauge, Timer, Zap, Edit2, 
  Dna, Cpu, Brain, Search, Car, 
  Activity, CircleDot, ChevronRight, Loader2,
  ExternalLink, CheckCircle2
} from "lucide-react";
import logo from "@/assets/logo-flame.png";
import ogLogo from "@/assets/og-logo.png";
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

const INDEX_TO_CAR_ID: Record<number, string> = {
  0: "coupe",
  5: "pickup",
  6: "suv",
  8: "jeep",
  10: "lamborghini",
  11: "ctr",
  12: "muscle",
  13: "f1",
  7: "van",
  9: "sierra"
};

const CAR_ASSETS: Record<string, any> = {
  "coupe": { name: "CYBER COUPE", img: cyberCoupe, color: "text-neon-pink" },
  "pickup": { name: "PICKUP TRUCK", img: pickupImg, color: "text-neon-cyan" },
  "suv": { name: "HYPER DRIFT SUV", img: suvImg, color: "text-neon-yellow" },
  "jeep": { name: "STEALTH JEEP", img: jeepImg, color: "text-neon-cyan" },
  "lamborghini": { name: "PROTO RACER", img: protoRacer, color: "text-primary" },
  "ctr": { name: "CTR INTERCEPTOR", img: stealthInterceptor, color: "text-neon-pink" },
  "muscle": { name: "MUSCLE MONSTER", img: muscleImg, color: "text-neon-yellow" },
  "f1": { name: "F1 PHANTOM", img: hyperDrift, color: "text-neon-pink" },
};

const CONTRACTS = [
  { name: "Session Tracker", address: "0x47B9D5B62C8302a89C435be307b9eAA8847FB295", purpose: "Tracks all gameplay sessions on-chain" },
  { name: "Vehicle Manager", address: "0xB9305b4898418c31dB5995b6dbBB0D29Ce63dd05", purpose: "Manages vehicle ownership and purchases" },
  { name: "Mission Manager", address: "0x4C2593C98bA57d24AFBBfd4ad62AeD2611416320", purpose: "Tracks achievements and mission progress" },
  { name: "Score Manager", address: "0xc82c80C0d243df6eE8d08D82EAF776b7D1E3e464", purpose: "Maintains on-chain global leaderboards" },
  { name: "Economy Manager", address: "0x1821E2654B5700d6C7C76277991EC6076696E829", purpose: "Secures in-game currency transactions" },
];

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout, authenticated } = usePrivy();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 0G Stats
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [achievementCount, setAchievementCount] = useState<number>(0);
  const [daStatus, setDaStatus] = useState<string>("Not Submitted");
  const [isZeroGLoading, setIsZeroGLoading] = useState(false);

  const identifier = useMemo(() => {
    return (user?.wallet?.address || user?.email?.address || "").toLowerCase();
  }, [user]);

  const handleSaveName = async () => {
    if (!tempName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://highway-hustle-backend.onrender.com/api";
      const token = localStorage.getItem("hh_auth_token");

      const response = await fetch(`${baseUrl}/player/game?user=${identifier}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ playerName: tempName.trim() })
      });
      const result = await response.json();
      if (result.success) {
        setPlayerData((prev: any) => ({
          ...prev,
          userGameData: { ...prev.userGameData, playerName: tempName.trim() }
        }));
        setIsEditing(false);
      }
    } catch (error) {
      console.error("❌ Error updating name:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!authenticated) {
      navigate({ to: "/" });
      return;
    }

    const fetchPlayerData = async () => {
      try {
        if (!identifier) {
          setIsLoading(false);
          return;
        }

        const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://highway-hustle-backend.onrender.com/api";
        
        // 1. Force a login sync
        const loginResponse = await fetch(`${baseUrl}/player/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            walletAddress: identifier,
            privyMetaData: {
              id: user.id,
              type: user.wallet ? "wallet" : "email"
            }
          })
        });
        const loginResult = await loginResponse.json();
        const token = loginResult.data?.token || localStorage.getItem("hh_auth_token");
        if (token) localStorage.setItem("hh_auth_token", token);

        // 2. Fetch the full record
        const response = await fetch(`${baseUrl}/player/all?user=${identifier}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await response.json();
        
        if (result.success) {
          setPlayerData(result.data);
          setTempName(result.data.userGameData?.playerName || "Unnamed");
        }

        // 3. Fetch 0G Network Stats
        fetchZeroGStats(identifier, token);

      } catch (error) {
        console.error("❌ Error fetching player data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchZeroGStats = async (id: string, token: string | null) => {
      setIsZeroGLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://highway-hustle-backend.onrender.com/api";
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};

        const [sessionRes, achievementRes, daRes] = await Promise.all([
          fetch(`${baseUrl}/blockchain/session-count?user=${id}`, { headers }),
          fetch(`${baseUrl}/blockchain/achievement-check?user=${id}&achievementId=ACHIEVED_1000M`, { headers }),
          fetch(`${baseUrl}/da/snapshot?user=${id}`, { headers })
        ]);

        const sessionData = await sessionRes.json();
        if (sessionData.success) setSessionCount(sessionData.count || 0);

        const achievementData = await achievementRes.json();
        if (achievementData.success && achievementData.hasAchievement) setAchievementCount(1);

        const daData = await daRes.json();
        if (daData.success) setDaStatus(daData.daStatus || "Not Submitted");

      } catch (err) {
        console.warn("⚠️ Failed to fetch some 0G stats:", err);
      } finally {
        setIsZeroGLoading(false);
      }
    };

    fetchPlayerData();
  }, [authenticated, user, navigate, identifier]);

  if (!authenticated || !user) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020208]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-neon-cyan border-t-transparent shadow-neon-cyan" />
      </div>
    );
  }

  const gameData = playerData?.userGameData || { playerName: "Unnamed", currency: 0, totalPlayedTime: 0 };
  const modeData = playerData?.playerGameModeData || { bestScoreOneWay: 0, bestScoreTwoWay: 0, bestScoreTimeAttack: 0, bestScoreBomb: 0 };
  const vehicleData = playerData?.playerVehicleData || { selectedPlayerCarIndex: 0 };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const totalScore = (modeData.bestScoreOneWay || 0) + 
                     (modeData.bestScoreTwoWay || 0) + 
                     (modeData.bestScoreTimeAttack || 0) + 
                     (modeData.bestScoreBomb || 0);
  
  const level = Math.floor(totalScore / 1000) + 1;
  const xpProgress = Math.min((totalScore % 1000) / 10, 100);

  return (
    <div className="min-h-screen bg-[#050510] text-foreground font-sans selection:bg-primary/30 relative">
      <NeuralBackground />

      <div className="relative z-10 pb-20">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050510]/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-3 transition hover:opacity-80">
              <img src={logo} alt="Logo" className="h-10 w-auto" />
              <span className="font-display text-xl font-black tracking-widest text-white uppercase italic">Highway Hustle</span>
            </Link>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
                className="flex items-center gap-2 font-display text-[10px] font-bold tracking-[0.2em] text-muted-foreground transition hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                SIGN OUT
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-12 relative z-10">
          <div className="mb-10 flex items-center justify-between">
            <h1 className="font-display text-4xl font-black tracking-[0.2em] text-neon-cyan uppercase italic">Driver Profile</h1>
            <Link to="/" className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] text-muted-foreground hover:text-white transition">
              <ArrowLeft className="h-3 w-3" />
              RETURN TO HIGHWAY
            </Link>
          </div>

        {/* Hero Profile Card */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-[#0a0a1a]/80 p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <CheckCircle2 className="h-40 w-40 text-neon-cyan" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-2 border-neon-cyan bg-neon-cyan/5 p-1 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                <div className="h-full w-full rounded-full bg-[#121225] flex items-center justify-center overflow-hidden">
                   <User className="h-10 w-10 text-neon-cyan" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0a0a1a] bg-neon-pink shadow-lg shadow-neon-pink/50">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="bg-white/5 border border-neon-cyan/30 rounded-md px-3 py-1 font-display text-2xl font-black text-white focus:outline-none focus:border-neon-cyan transition-all w-full max-w-[250px]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') setIsEditing(false);
                      }}
                    />
                    <button onClick={handleSaveName} disabled={isSaving} className="p-1.5 rounded-md bg-neon-cyan/20 text-neon-cyan">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleDot className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-md bg-white/5 text-muted-foreground">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-4xl font-black tracking-widest text-white italic">{gameData.playerName || "Unnamed"}</h2>
                    <button onClick={() => setIsEditing(true)} className="rounded-md bg-white/5 p-1.5 hover:bg-white/10 transition">
                      <Edit2 className="h-4 w-4 text-neon-cyan" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <p className="font-display text-[10px] font-bold tracking-[0.4em] text-neon-cyan uppercase">Elite Racer</p>
                <div className="h-1 w-1 rounded-full bg-white/20" />
                <div className="flex items-center gap-1.5">
                  <img src={ogLogo} alt="0G" className="h-3 w-auto" />
                  <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Verified on 0G Network</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.05] p-4 text-center min-w-[120px] backdrop-blur-sm">
              <div className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1 uppercase">DRIVER LVL</div>
              <div className="font-display text-4xl font-black text-neon-pink">{level}</div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Trophy className="h-5 w-5 text-neon-cyan" />} label="Total Score" value={totalScore.toLocaleString()} />
          <StatCard 
            icon={<div className="h-6 w-6 rounded-full bg-gradient-to-br from-neon-blue to-primary animate-pulse shadow-[0_0_10px_rgba(0,186,255,0.5)]" />} 
            label="Highway Coins" 
            value={(gameData.currency || 0).toLocaleString()} 
          />
          <StatCard icon={<Activity className="h-5 w-5 text-neon-blue" />} label="Global Rank" value="#124" />
          <StatCard icon={<Zap className="h-5 w-5 text-neon-pink" />} label="Play Time" value={formatTime(gameData.totalPlayedTime || 0)} />
        </div>

        {/* 0G Features Integration */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <h3 className="font-display text-lg font-black tracking-[0.3em] text-white uppercase italic">0G Protocol Integration</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
            {isZeroGLoading && <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" />}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <OGFeatureCard 
              icon={<Dna className="h-6 w-6 text-neon-cyan" />} 
              name="0G EVM" 
              sub="Session + score + vehicle events" 
              count={sessionCount}
              description="Real-time on-chain session tracking"
            />
            <OGFeatureCard 
              icon={<Shield className="h-6 w-6 text-neon-pink" />} 
              name="0G DA" 
              sub={daStatus === "Not Submitted" ? "Pending Snapshot" : "Finalized Snapshot"} 
              count={daStatus === "confirmed" || daStatus === "finalized" ? 1 : 0} 
              description="Data Availability state snapshots"
              status={daStatus}
            />
            <OGFeatureCard 
              icon={<Brain className="h-6 w-6 text-neon-yellow" />} 
              name="0G Compute" 
              sub="AI leaderboard commentary" 
              count={1}
              description="Verifiable AI inference stats"
            />
            <OGFeatureCard 
              icon={<Search className="h-6 w-6 text-primary" />} 
              name="Explorer Proof" 
              sub="On-chain achievement tokens" 
              count={achievementCount}
              description="Verifiable achievement milestones"
            />
          </div>
        </section>

        {/* Career Statistics & Active Vehicle */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Active Vehicle Card */}
          <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a1a] p-8 transition hover:border-white/10 shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Car className="h-40 w-40 -rotate-12" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="w-full md:w-1/2 aspect-video rounded-2xl bg-black/40 overflow-hidden border border-white/5 relative group/img">
                <img 
                  src={CAR_ASSETS[INDEX_TO_CAR_ID[vehicleData.selectedPlayerCarIndex] || "coupe"]?.img} 
                  alt="Active Vehicle" 
                  className="w-full h-full object-cover opacity-80 group-hover/img:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-[10px] font-black tracking-[0.3em] text-neon-cyan uppercase">ACTIVE VEHICLE</span>
                  <h3 className={`text-2xl font-black tracking-tight ${CAR_ASSETS[INDEX_TO_CAR_ID[vehicleData.selectedPlayerCarIndex] || "coupe"]?.color || "text-white"} uppercase italic`}>
                    {CAR_ASSETS[INDEX_TO_CAR_ID[vehicleData.selectedPlayerCarIndex] || "coupe"]?.name}
                  </h3>
                </div>
              </div>

              <div className="w-full md:w-1/2 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
                      <Zap className="h-6 w-6 text-neon-cyan" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase">Status</p>
                      <p className="text-xl font-black text-white uppercase italic">Ready for Deployment</p>
                    </div>
                 </div>
                 <Link 
                  to="/marketplace" 
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-black font-black text-xs tracking-[0.2em] hover:bg-neon-cyan transition-all active:scale-95 uppercase italic"
                 >
                   OPEN GARAGE
                   <ChevronRight className="h-4 w-4" />
                 </Link>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="rounded-3xl border border-white/5 bg-[#0a0a1a] p-8 flex flex-col justify-between shadow-xl">
            <div>
              <h3 className="text-xs font-black tracking-[0.3em] text-muted-foreground uppercase mb-8">Driver Progression</h3>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-3">
                    <span>Rank Progression</span>
                    <span>{xpProgress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-cyan shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-1000" style={{ width: `${xpProgress}%` }} />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                   <div className="flex items-center gap-3 mb-2">
                     <Trophy className="h-4 w-4 text-neon-yellow" />
                     <span className="text-[10px] font-bold tracking-widest text-white uppercase">Next Milestone</span>
                   </div>
                   <p className="text-xs font-bold text-muted-foreground">Reach 10,000 Total Score to unlock "Apex Predator" Rank.</p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center gap-4 text-muted-foreground">
                <Shield className="h-5 w-5 text-neon-cyan" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Pro Circuit Qualified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Mode Statistics */}
        <section className="mb-12">
          <h3 className="mb-8 font-display text-lg font-black tracking-[0.3em] text-white uppercase italic">Game Mode Performance</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ModeStatCard name="One Way" icon={<div className="text-neon-blue font-black text-2xl rotate-45">↑</div>} best={modeData.bestScoreOneWay || 0} time={formatTime(gameData.totalPlayedTime || 0)} />
            <ModeStatCard name="Two Way" icon={<div className="text-neon-blue font-black text-2xl">⇅</div>} best={modeData.bestScoreTwoWay || 0} time={formatTime(gameData.totalPlayedTime || 0)} />
            <ModeStatCard name="Speed Run" icon={<Car className="h-6 w-6 text-neon-blue" />} best={modeData.bestScoreTimeAttack || 0} time={formatTime(gameData.totalPlayedTime || 0)} />
            <ModeStatCard name="Time Bomb" icon={<Timer className="h-6 w-6 text-neon-blue" />} best={modeData.bestScoreBomb || 0} time={formatTime(gameData.totalPlayedTime || 0)} />
          </div>
        </section>

        {/* Contract Addresses */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-8">
             <h3 className="font-display text-lg font-black tracking-[0.3em] text-white uppercase italic">0G Network Contracts</h3>
             <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONTRACTS.map((contract) => (
              <div key={contract.address} className="rounded-xl border border-white/5 bg-[#0a0a1a] p-6 hover:border-neon-cyan/30 transition group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition">
                   <ExternalLink className="h-10 w-10" />
                </div>
                <div className="flex flex-col h-full relative z-10">
                  <h4 className="text-xs font-black tracking-[0.2em] text-white uppercase mb-2 italic">{contract.name}</h4>
                  <p className="text-[10px] text-muted-foreground mb-4 uppercase font-bold opacity-60 leading-relaxed">{contract.purpose}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <code className="text-[10px] font-mono text-neon-cyan/70">{contract.address.slice(0, 8)}...{contract.address.slice(-6)}</code>
                    <a 
                      href={`https://chainscan.0g.ai/address/${contract.address}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        .text-gradient-chrome {
          background: linear-gradient(to bottom, #fff 0%, #a5a5a5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a1a] p-6 flex items-center gap-4 transition hover:border-white/20 shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 shadow-inner">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">{label}</div>
        <div className="font-display text-2xl font-black text-white mt-1 leading-none italic">{value}</div>
      </div>
    </div>
  );
}

function ModeStatCard({ name, icon, best, time }: { name: string, icon: React.ReactNode, best: number, time: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a1a] p-8 transition hover:border-neon-blue/30 group shadow-lg">
      <div className="flex items-center gap-4 mb-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-neon-blue/5 border border-neon-blue/20 group-hover:border-neon-blue/50 transition shadow-[0_0_20px_rgba(0,186,255,0.05)]">
          {icon}
        </div>
        <h4 className="font-display text-xl font-black tracking-widest text-white uppercase italic">{name}</h4>
      </div>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Best Score</span>
          <span className="font-display text-sm font-black text-neon-cyan italic">{best.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Time Played</span>
          <span className="font-display text-sm font-black text-neon-cyan italic">{time}</span>
        </div>
      </div>
    </div>
  );
}

function OGFeatureCard({ 
  icon, name, sub, count = 0, description, status 
}: { 
  icon: React.ReactNode, name: string, sub: string, count?: number, description?: string, status?: string 
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0a0a1a] p-8 transition hover:border-white/20 relative overflow-hidden group shadow-lg">
      <div className="absolute top-0 right-0 p-4 opacity-5">
         {icon}
      </div>
      <div className="flex items-center gap-3 mb-8">
        <div className="text-muted-foreground group-hover:text-white transition">{icon}</div>
        <h4 className="font-display text-lg font-black tracking-widest text-white uppercase italic">{name}</h4>
      </div>
      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Activity Count</span>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-black text-neon-cyan">{count}</span>
            {status === "confirmed" && <CheckCircle2 className="h-3 w-3 text-neon-green" />}
          </div>
        </div>
        <div className="mt-2 text-[11px] font-bold tracking-wider text-neon-cyan leading-relaxed uppercase opacity-80 group-hover:opacity-100 transition italic">
          {sub}
        </div>
        {description && (
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}
